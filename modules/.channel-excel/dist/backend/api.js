"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _apicache = _interopRequireDefault(require("apicache"));

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _http = require("common/http");

var _lodash = _interopRequireDefault(require("lodash"));

var _moment = _interopRequireDefault(require("moment"));

var _multer = _interopRequireDefault(require("multer"));

var _multerS = _interopRequireDefault(require("multer-s3"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ERR_USER_ID_REQ = '`userId` is required and must be valid';
const ERR_MSG_TYPE = '`type` is required and must be valid';
const ERR_CONV_ID_REQ = '`conversationId` is required and must be valid';
const ERR_BAD_LANGUAGE = '`language` is required and must be valid';
const USER_ID_MAX_LENGTH = 40;
const SUPPORTED_MESSAGES = ['text', 'quick_reply', 'form', 'login_prompt', 'visit', 'request_start_conversation', 'postback'];

var _default = async (bp, db) => {
  const asyncMiddleware = (0, _http.asyncMiddleware)(bp.logger);
  const globalConfig = await bp.config.getModuleConfig('channel-excel');

  const diskStorage = _multer.default.diskStorage({
    destination: globalConfig.fileUploadPath,
    limits: {
      files: 1,
      fileSize: 5242880 // 5MB

    },
    filename: function (req, file, cb) {
      const userId = _lodash.default.get(req, 'params.userId') || 'anonymous';

      const ext = _path.default.extname(file.originalname);

      cb(undefined, `${userId}_${new Date().getTime()}${ext}`);
    }
  });

  let upload = (0, _multer.default)({
    storage: diskStorage
  });

  if (globalConfig.uploadsUseS3) {
    /*
      You can override AWS's default settings here. Example:
      { region: 'us-east-1', apiVersion: '2014-10-01', credentials: {...} }
     */
    const awsConfig = {
      region: globalConfig.uploadsS3Region,
      credentials: {
        accessKeyId: globalConfig.uploadsS3AWSAccessKey,
        secretAccessKey: globalConfig.uploadsS3AWSAccessSecret
      }
    };

    if (!awsConfig.credentials.accessKeyId && !awsConfig.credentials.secretAccessKey) {
      delete awsConfig.credentials;
    }

    if (!awsConfig.region) {
      delete awsConfig.region;
    }

    const s3 = new _awsSdk.default.S3(awsConfig);
    const s3Storage = (0, _multerS.default)({
      s3: s3,
      bucket: globalConfig.uploadsS3Bucket || 'uploads',
      contentType: _multerS.default.AUTO_CONTENT_TYPE,
      cacheControl: 'max-age=31536000',
      // one year caching
      acl: 'public-read',
      key: function (req, file, cb) {
        const userId = _lodash.default.get(req, 'params.userId') || 'anonymous';

        const ext = _path.default.extname(file.originalname);

        cb(undefined, `${userId}_${new Date().getTime()}${ext}`);
      }
    });
    upload = (0, _multer.default)({
      storage: s3Storage
    });
  }

  const router = bp.http.createRouterForBot('channel-excel', {
    checkAuthentication: false,
    enableJsonBodyParser: true
  });

  const perBotCache = _apicache.default.options({
    appendKey: req => req.method + ' for bot ' + req.params && req.params.botId,
    statusCodes: {
      include: [200]
    }
  }).middleware;

  router.get('/botInfo', perBotCache('1 minute'), asyncMiddleware(async (req, res) => {
    const {
      botId
    } = req.params;
    const security = (await bp.config.getModuleConfig('channel-excel')).security; // usage of global because a user could overwrite bot scoped configs

    const config = await bp.config.getModuleConfigForBot('channel-excel', botId);
    const botInfo = await bp.bots.getBotById(botId);

    if (!botInfo) {
      return res.sendStatus(404);
    }

    res.send({
      showBotInfoPage: config.infoPage && config.infoPage.enabled || config.showBotInfoPage,
      name: botInfo.name,
      description: config.infoPage && config.infoPage.description || botInfo.description,
      details: botInfo.details,
      languages: botInfo.languages,
      extraStylesheet: config.extraStylesheet,
      security
    });
  })); // ?conversationId=xxx (optional)

  router.post('/messages/:userId', bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const {
      botId,
      userId = undefined
    } = req.params;

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ);
    }

    const user = await bp.users.getOrCreateUser('excel', userId, botId);
    const payload = req.body || {};
    let {
      conversationId = undefined
    } = req.query || {};
    conversationId = conversationId && parseInt(conversationId);

    if (!SUPPORTED_MESSAGES.includes(payload.type)) {
      // TODO: Support files
      return res.status(400).send(ERR_MSG_TYPE);
    }

    if (payload.type === 'visit') {
      const {
        timezone,
        language
      } = payload;
      const isValidTimezone = _lodash.default.isNumber(timezone) && timezone >= -12 && timezone <= 14 && timezone % 0.5 === 0;
      const isValidLanguage = language.length < 4 && !_lodash.default.get(user, 'result.attributes.language');
      const newAttributes = { ...(isValidTimezone && {
          timezone
        }),
        ...(isValidLanguage && {
          language
        })
      };

      if (Object.getOwnPropertyNames(newAttributes).length) {
        await bp.users.updateAttributes('excel', userId, newAttributes);
      }
    }

    if (!conversationId) {
      conversationId = await db.getOrCreateRecentConversation(botId, userId, {
        originatesFromUserMessage: true
      });
    }

    await sendNewMessage(botId, userId, conversationId, payload, req.credentials, !!req.headers.authorization, user.result);
    return res.sendStatus(200);
  })); // ?conversationId=xxx (required)

  router.post('/messages/:userId/files', upload.single('file'), bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const {
      botId = undefined,
      userId = undefined
    } = req.params || {};

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ);
    }

    await bp.users.getOrCreateUser('excel', userId, botId); // Just to create the user if it doesn't exist

    let {
      conversationId = undefined
    } = req.query || {};
    conversationId = conversationId && parseInt(conversationId);

    if (!conversationId) {
      return res.status(400).send(ERR_CONV_ID_REQ);
    }

    const payload = {
      text: `Uploaded a file [${req.file.originalname}]`,
      type: 'file',
      storage: req.file.location ? 's3' : 'local',
      url: req.file.location || req.file.path || undefined,
      name: req.file.filename,
      originalName: req.file.originalname,
      mime: req.file.contentType || req.file.mimetype,
      size: req.file.size
    };
    await sendNewMessage(botId, userId, conversationId, payload, req.credentials);
    return res.sendStatus(200);
  }));
  router.get('/conversations/:userId/:conversationId', async (req, res) => {
    const {
      userId,
      conversationId,
      botId
    } = req.params;

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ);
    }

    const conversation = await db.getConversation(userId, conversationId, botId);
    return res.send(conversation);
  });
  router.get('/conversations/:userId', async (req, res) => {
    const {
      botId = undefined,
      userId = undefined
    } = req.params || {};

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ);
    }

    await bp.users.getOrCreateUser('excel', userId, botId);
    const conversations = await db.listConversations(userId, botId);
    const config = await bp.config.getModuleConfigForBot('channel-excel', botId);
    return res.send({
      conversations: [...conversations],
      startNewConvoOnTimeout: config.startNewConvoOnTimeout,
      recentConversationLifetime: config.recentConversationLifetime
    });
  });

  function validateUserId(userId) {
    if (!userId || userId.length > USER_ID_MAX_LENGTH) {
      return false;
    }

    return /[a-z0-9-_]+/i.test(userId);
  }

  async function sendNewMessage(botId, userId, conversationId, payload, credentials, useDebugger, user) {
    const config = await bp.config.getModuleConfigForBot('channel-excel', botId);

    if ((!payload.text || !_lodash.default.isString(payload.text) || payload.text.length > config.maxMessageLength) && payload.type != 'postback') {
      throw new Error(`Text must be a valid string of less than ${config.maxMessageLength} chars`);
    }

    let sanitizedPayload = payload;

    if (payload.sensitive) {
      const sensitive = Array.isArray(payload.sensitive) ? payload.sensitive : [payload.sensitive];
      sanitizedPayload = _lodash.default.omit(payload, [...sensitive, 'sensitive']);
    }

    const event = bp.IO.Event({
      botId,
      channel: 'excel',
      direction: 'incoming',
      payload,
      target: userId,
      threadId: conversationId,
      type: payload.type,
      credentials
    });

    if (useDebugger) {
      event.debugger = true;
    }

    const message = await db.appendUserMessage(botId, userId, conversationId, sanitizedPayload, event.id, user);
    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message));
    await bp.events.sendEvent(event);
  }

  router.post('/events/:userId', bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const payload = req.body || {};
    const {
      botId = undefined,
      userId = undefined
    } = req.params || {};
    await bp.users.getOrCreateUser('excel', userId, botId);
    const conversationId = await db.getOrCreateRecentConversation(botId, userId, {
      originatesFromUserMessage: true
    });
    const event = bp.IO.Event({
      botId,
      channel: 'excel',
      direction: 'incoming',
      target: userId,
      threadId: conversationId,
      type: payload.type,
      payload,
      credentials: req.credentials
    });
    await bp.events.sendEvent(event);
    res.sendStatus(200);
  }));
  router.post('/saveFeedback', bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const {
      eventId,
      target,
      feedback
    } = req.body;

    if (!target || !eventId || !feedback) {
      return res.status(400).send('Missing required fields');
    }

    try {
      await bp.events.saveUserFeedback(eventId, target, feedback, 'qna');
      res.sendStatus(200);
    } catch (err) {
      res.status(400).send(err);
    }
  }));
  router.post('/feedbackInfo', bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const {
      target,
      eventIds
    } = req.body;

    if (!target || !eventIds) {
      return res.status(400).send('Missing required fields');
    }

    res.send((await db.getFeedbackInfoForEventIds(target, eventIds)));
  }));
  router.post('/conversations/:userId/:conversationId/reset', bp.http.extractExternalToken, asyncMiddleware(async (req, res) => {
    const {
      botId,
      userId,
      conversationId
    } = req.params;
    await bp.users.getOrCreateUser('excel', userId, botId);
    const payload = {
      text: `Conversation Reset`,
      type: 'session_reset'
    };
    await sendNewMessage(botId, userId, conversationId, payload, req.credentials);
    const sessionId = await bp.dialog.createId({
      botId,
      target: userId,
      threadId: conversationId,
      channel: 'excel'
    });
    await bp.dialog.deleteSession(sessionId);
    res.sendStatus(200);
  }));
  router.post('/conversations/:userId/new', async (req, res) => {
    const {
      userId,
      botId
    } = req.params;
    const convoId = await db.createConversation(botId, userId);
    res.send({
      convoId
    });
  });
  router.post('/conversations/:userId/:conversationId/reference/:reference', async (req, res) => {
    try {
      const {
        botId,
        userId,
        reference
      } = req.params;
      let {
        conversationId
      } = req.params;
      await bp.users.getOrCreateUser('excel', userId, botId);

      if (typeof reference !== 'string' || !reference.length || reference.indexOf('=') === -1) {
        throw new Error('Invalid reference');
      }

      if (!conversationId || conversationId == 'null') {
        conversationId = await db.getOrCreateRecentConversation(botId, userId, {
          originatesFromUserMessage: true
        });
      }

      const message = reference.slice(0, reference.lastIndexOf('='));
      const signature = reference.slice(reference.lastIndexOf('=') + 1);
      const verifySignature = await bp.security.getMessageSignature(message);

      if (verifySignature !== signature) {
        throw new Error('Bad reference signature');
      }

      const payload = {
        text: message,
        signature: signature,
        type: 'session_reference'
      };
      const event = bp.IO.Event({
        botId,
        channel: 'excel',
        direction: 'incoming',
        target: userId,
        threadId: conversationId,
        type: payload.type,
        payload,
        credentials: req['credentials']
      });
      await bp.events.sendEvent(event);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
    }
  });
  router.get('/preferences/:userId', async (req, res) => {
    const {
      userId,
      botId
    } = req.params;
    const {
      result
    } = await bp.users.getOrCreateUser('excel', userId, botId);
    return res.send({
      language: result.attributes.language
    });
  });
  router.post('/preferences/:userId', async (req, res) => {
    const {
      userId,
      botId
    } = req.params;
    const payload = req.body || {};
    const preferredLanguage = payload.language;
    const bot = await bp.bots.getBotById(botId);
    const validLanguage = bot.languages.includes(preferredLanguage);

    if (!validLanguage) {
      return res.status(400).send(ERR_BAD_LANGUAGE);
    }

    await bp.users.updateAttributes('excel', userId, {
      language: preferredLanguage
    });
    return res.sendStatus(200);
  });

  const getMessageContent = (message, type) => {
    const {
      payload
    } = message;

    if (type === 'file') {
      return payload && payload.url || message.message_data.url;
    }

    const wrappedText = _lodash.default.get(payload, 'wrapped.text');

    return payload && payload.text || message.message_text || wrappedText || `Event (${type})`;
  };

  const convertToTxtFile = async conversation => {
    const {
      messages
    } = conversation;
    const {
      result: user
    } = await bp.users.getOrCreateUser('excel', conversation.userId);
    const timeFormat = 'MM/DD/YY HH:mm';
    const fullName = `${user.attributes['first_name'] || ''} ${user.attributes['last_name'] || ''}`;
    const metadata = `Title: ${conversation.title}\r\nCreated on: ${(0, _moment.default)(conversation.created_on).format(timeFormat)}\r\nUser: ${fullName}\r\n-----------------\r\n`;
    const messagesAsTxt = messages.map(message => {
      const type = message.payload && message.payload.type || message.message_type;

      if (type === 'session_reset') {
        return '';
      }

      const userName = message.full_name.indexOf('undefined') > -1 ? 'User' : message.full_name;
      return `[${(0, _moment.default)(message.sent_on).format(timeFormat)}] ${userName}: ${getMessageContent(message, type)}\r\n`;
    });
    return [metadata, ...messagesAsTxt].join('');
  };

  router.get('/conversations/:userId/:conversationId/download/txt', async (req, res) => {
    const {
      userId,
      conversationId,
      botId
    } = req.params;

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ);
    }

    const conversation = await db.getConversation(userId, conversationId, botId);
    const txt = await convertToTxtFile(conversation);
    res.send({
      txt,
      name: `${conversation.title}.txt`
    });
  });
};

exports.default = _default;
//# sourceMappingURL=api.js.map