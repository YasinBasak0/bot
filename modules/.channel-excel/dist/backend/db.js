"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _moment = _interopRequireDefault(require("moment"));

var _ms = _interopRequireDefault(require("ms"));

var _uuid = _interopRequireDefault(require("uuid"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class WebchatDb {
  constructor(bp) {
    this.bp = bp;

    _defineProperty(this, "MAX_RETRY_ATTEMPTS", 3);

    _defineProperty(this, "knex", void 0);

    _defineProperty(this, "users", void 0);

    _defineProperty(this, "batchedMessages", []);

    _defineProperty(this, "batchedConvos", {});

    _defineProperty(this, "messagePromise", void 0);

    _defineProperty(this, "convoPromise", void 0);

    _defineProperty(this, "batchSize", void 0);

    this.users = bp.users;
    this.knex = bp['database']; // TODO Fixme

    this.batchSize = this.knex.isLite ? 40 : 2000;
    setInterval(() => this.flush(), (0, _ms.default)('1s'));
  }

  flush() {
    // tslint:disable-next-line: no-floating-promises
    this.flushMessages(); // tslint:disable-next-line: no-floating-promises

    this.flushConvoUpdates();
  }

  async flushMessages() {
    if (this.messagePromise || !this.batchedMessages.length) {
      return;
    }

    const batchCount = this.batchedMessages.length >= this.batchSize ? this.batchSize : this.batchedMessages.length;
    const elements = this.batchedMessages.splice(0, batchCount);
    this.messagePromise = this.knex.batchInsert('excel_messages', elements.map(x => _lodash.default.omit(x, 'retry')), this.batchSize).catch(err => {
      this.bp.logger.attachError(err).error(`Couldn't store messages to the database. Re-queuing elements`);
      const elementsToRetry = elements.map(x => ({ ...x,
        retry: x.retry ? x.retry + 1 : 1
      })).filter(x => x.retry < this.MAX_RETRY_ATTEMPTS);
      this.batchedMessages.push(...elementsToRetry);
    }).finally(() => {
      this.messagePromise = undefined;
    });
  }

  async flushConvoUpdates() {
    if (this.convoPromise || !Object.keys(this.batchedConvos).length) {
      return;
    }

    this.convoPromise = this.knex.transaction(async trx => {
      const queries = [];

      for (const key in this.batchedConvos) {
        const [conversationId, userId, botId] = key.split('_');
        const value = this.batchedConvos[key];
        const query = this.knex('excel_conversations').where({
          id: conversationId,
          userId,
          botId
        }).update({
          last_heard_on: value
        }).transacting(trx);
        queries.push(query);
      }

      this.batchedConvos = {};
      await Promise.all(queries).then(trx.commit).catch(trx.rollback);
    }).finally(() => {
      this.convoPromise = undefined;
    });
  }

  async getUserInfo(userId, user) {
    if (!user) {
      user = (await this.users.getOrCreateUser('excel', userId)).result;
    }

    let fullName = 'User';

    if (user && user.attributes) {
      const {
        first_name,
        last_name
      } = user.attributes;

      if (first_name || last_name) {
        fullName = `${first_name || ''} ${last_name || ''}`.trim();
      }
    }

    return {
      fullName,
      avatar_url: _lodash.default.get(user, 'attributes.picture_url')
    };
  }

  async initialize() {
    return this.knex.createTableIfNotExists('excel_conversations', function (table) {
      table.increments('id').primary();
      table.string('userId');
      table.string('botId');
      table.string('title');
      table.string('description');
      table.string('logo_url');
      table.timestamp('created_on');
      table.timestamp('last_heard_on'); // The last time the user interacted with the bot. Used for "recent" conversation

      table.timestamp('user_last_seen_on');
      table.timestamp('bot_last_seen_on');
    }).then(() => {
      return this.knex.createTableIfNotExists('excel_messages', function (table) {
        table.string('id').primary();
        table.integer('conversationId');
        table.string('incomingEventId');
        table.string('userId');
        table.string('message_type'); // @ deprecated Remove in a future release (11.9)

        table.text('message_text'); // @ deprecated Remove in a future release (11.9)

        table.jsonb('message_raw'); // @ deprecated Remove in a future release (11.9)

        table.jsonb('message_data'); // @ deprecated Remove in a future release (11.9)

        table.jsonb('payload');
        table.string('full_name');
        table.string('avatar_url');
        table.timestamp('sent_on');
      });
    });
  }

  async appendUserMessage(botId, userId, conversationId, payload, incomingEventId, user) {
    const {
      fullName,
      avatar_url
    } = await this.getUserInfo(userId, user);
    const {
      type,
      text,
      raw,
      data
    } = payload;
    const now = new Date();
    const message = {
      id: _uuid.default.v4(),
      conversationId,
      incomingEventId,
      userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.format(now)
    };
    this.batchedMessages.push(message);
    this.batchedConvos[`${conversationId}_${userId}_${botId}`] = this.knex.date.format(now);
    return { ...message,
      sent_on: now,
      message_raw: raw,
      message_data: data,
      payload: payload
    };
  }

  async appendBotMessage(botName, botAvatar, conversationId, payload, incomingEventId) {
    const {
      type,
      text,
      raw,
      data
    } = payload;
    const now = new Date();
    const message = {
      id: _uuid.default.v4(),
      conversationId: conversationId,
      incomingEventId,
      userId: undefined,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.format(now)
    };
    this.batchedMessages.push(message);
    return { ...message,
      sent_on: now,
      message_raw: raw,
      message_data: data,
      payload: payload
    };
  }

  async createConversation(botId, userId, {
    originatesFromUserMessage = false
  } = {}) {
    const uid = Math.random().toString().substr(2, 6);
    const title = `Conversation ${uid}`;
    await this.knex('excel_conversations').insert({
      botId,
      userId,
      created_on: this.knex.date.now(),
      last_heard_on: originatesFromUserMessage ? this.knex.date.now() : undefined,
      title
    }).then();
    const conversation = await this.knex('excel_conversations').where({
      title,
      userId,
      botId
    }).select('id').then().get(0);
    return conversation && conversation.id;
  }

  async getOrCreateRecentConversation(botId, userId, {
    originatesFromUserMessage = false
  } = {}) {
    // TODO: Lifetime config by bot
    const config = await this.bp.config.getModuleConfigForBot('channel-excel', botId);
    const recentCondition = this.knex.date.isAfter('last_heard_on', (0, _moment.default)().subtract((0, _ms.default)(config.recentConversationLifetime), 'ms').toDate());
    const conversation = await this.knex('excel_conversations').select('id').whereNotNull('last_heard_on').andWhere({
      userId,
      botId
    }).andWhere(recentCondition).orderBy('last_heard_on', 'desc').limit(1).then().get(0);
    return conversation ? conversation.id : this.createConversation(botId, userId, {
      originatesFromUserMessage
    });
  }

  async listConversations(userId, botId) {
    const conversations = await this.knex('excel_conversations').select('id').where({
      userId,
      botId
    }).orderBy('last_heard_on', 'desc').limit(100).then();
    const conversationIds = conversations.map(c => c.id);
    let lastMessages = this.knex.from('excel_messages').distinct(this.knex.raw('ON ("conversationId") *')).orderBy('conversationId').orderBy('sent_on', 'desc');

    if (this.knex.isLite) {
      const lastMessagesDate = this.knex('excel_messages').whereIn('conversationId', conversationIds).groupBy('conversationId').select(this.knex.raw('max(sent_on) as date'));
      lastMessages = this.knex.from('excel_messages').select('*').whereIn('sent_on', lastMessagesDate);
    }

    return this.knex.from(function () {
      this.from('excel_conversations').where({
        userId,
        botId
      }).as('wc');
    }).leftJoin(lastMessages.as('wm'), 'wm.conversationId', 'wc.id').orderBy('wm.sent_on', 'desc').select('wc.id', 'wc.title', 'wc.description', 'wc.logo_url', 'wc.created_on', 'wc.last_heard_on', 'wm.message_type', 'wm.message_text', this.knex.raw('wm.full_name as message_author'), this.knex.raw('wm.avatar_url as message_author_avatar'), this.knex.raw('wm.sent_on as message_sent_on'));
  }

  async getConversation(userId, conversationId, botId) {
    const config = await this.bp.config.getModuleConfigForBot('channel-excel', botId);
    const condition = {
      userId,
      botId
    };

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId;
    }

    const conversation = await this.knex('excel_conversations').where(condition).then().get(0);

    if (!conversation) {
      return undefined;
    }

    const messages = await this.getConversationMessages(conversationId, config.maxMessagesHistory);
    messages.forEach(m => {
      return Object.assign(m, {
        message_raw: this.knex.json.get(m.message_raw),
        message_data: this.knex.json.get(m.message_data),
        payload: this.knex.json.get(m.payload)
      });
    });
    return Object.assign({}, conversation, {
      messages: _lodash.default.orderBy(messages, ['sent_on'], ['asc'])
    });
  }

  async getConversationMessages(conversationId, limit, fromId) {
    let query = this.knex('excel_messages').where({
      conversationId: conversationId
    });

    if (fromId) {
      query = query.andWhere('id', '<', fromId);
    }

    return query.whereNot({
      message_type: 'visit'
    }).orderBy('sent_on', 'desc').limit(limit);
  }

  async getFeedbackInfoForEventIds(target, eventIds) {
    return this.knex('events').select(['incomingEventId', 'feedback']).whereIn('incomingEventId', eventIds).andWhere({
      target,
      direction: 'incoming'
    });
  }

}

exports.default = WebchatDb;
//# sourceMappingURL=db.js.map