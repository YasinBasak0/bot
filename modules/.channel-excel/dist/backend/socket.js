"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _renderer = require("./renderer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const outgoingTypes = ['text', 'typing', 'login_prompt', 'file', 'carousel', 'custom', 'data', 'select_range', 'set_range', 'set_suggestions', 'execute_code'];

var _default = async (bp, db) => {
  const config = {}; // FIXME

  const {
    botName = 'Bot',
    botAvatarUrl = undefined
  } = config || {}; // FIXME

  bp.events.registerMiddleware({
    description: 'Sends out messages that targets platform = webchat.' + ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'excel.sendMessages',
    order: 100
  });

  async function outgoingHandler(event, next) {
    if (event.channel !== 'excel') {
      return next();
    }

    const userId = event.target;
    const conversationId = event.threadId || (await db.getOrCreateRecentConversation(event.botId, userId));
    event.payload = (0, _renderer.convertPayload)(event.payload);

    if (event.payload.metadata) {
      event.payload = await applyChannelEffects(event, userId, conversationId);
    }

    event.type = event.payload.type;
    const messageType = event.type === 'default' ? 'text' : event.type;

    if (!_lodash.default.includes(outgoingTypes, messageType)) {
      bp.logger.warn(`Unsupported event type: ${messageType}`);
      return next(undefined, true);
    }

    const standardTypes = ['text', 'carousel', 'custom', 'file', 'login_prompt', 'select_range', 'set_range', 'set_suggestions', 'execute_code'];

    if (!event.payload.type) {
      event.payload.type = messageType;
    }

    console.log('outgoing event: ');
    console.log(event);

    if (messageType === 'typing') {
      await sendTyping(event, userId, conversationId);
    } else if (messageType === 'data') {
      const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.data', event.payload);
      bp.realtime.sendPayload(payload);
    } else if (standardTypes.includes(messageType)) {
      const message = await db.appendBotMessage((event.payload || {}).botName || botName, (event.payload || {}).botAvatarUrl || botAvatarUrl, conversationId, event.payload, event.incomingEventId);
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message));
    } else {
      bp.logger.warn(`Message type "${messageType}" not implemented yet`);
    }

    next(undefined, false); // TODO Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
  }

  const sendTyping = async (event, userId, conversationId) => {
    const typing = parseTyping(event.payload.value);
    const payload = bp.RealTimePayload.forVisitor(userId, 'webchat.typing', {
      timeInMs: typing,
      conversationId
    }); // Don't store "typing" in DB

    bp.realtime.sendPayload(payload); // await Promise.delay(typing)
  };

  const applyChannelEffects = async (event, userId, conversationId) => {
    let payload = event.payload;
    console.log(payload);
    const {
      __buttons,
      __typing,
      __trimText,
      __markdown,
      __dropdown,
      __collectFeedback
    } = payload.metadata;

    if (__typing) {
      await sendTyping(event, userId, conversationId);
    }

    if (__trimText && !isNaN(__trimText)) {
      payload.trimLength = __trimText;
    }

    if (__markdown) {
      payload.markdown = true;
    }

    if (__collectFeedback) {
      payload.collectFeedback = true;
    }

    if (__buttons) {
      payload = {
        type: 'custom',
        module: 'channel-excel',
        component: 'QuickReplies',
        quick_replies: __buttons,
        wrapped: {
          type: event.type,
          ..._lodash.default.omit(event.payload, 'quick_replies')
        }
      };
    }

    if (__dropdown) {
      payload = {
        type: 'custom',
        module: 'extensions',
        component: 'Dropdown',
        ...(_lodash.default.isArray(__dropdown) ? {
          options: __dropdown
        } : __dropdown),
        wrapped: {
          type: event.type,
          ..._lodash.default.omit(event.payload, 'options')
        }
      };
    }

    return payload;
  };
};

exports.default = _default;

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 500;
  }

  return Math.max(typing, 500);
}
//# sourceMappingURL=socket.js.map