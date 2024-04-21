"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertPayload = void 0;

const convertPayload = data => {
  const {
    metadata,
    extraProps
  } = data;
  const botUrl = extraProps === null || extraProps === void 0 ? void 0 : extraProps.BOT_URL;
  const common = {
    collectFeedback: metadata === null || metadata === void 0 ? void 0 : metadata.__collectFeedback,
    metadata
  };

  if (data.type === 'image') {
    return {
      type: 'file',
      title: data.title,
      url: `${botUrl}${data.image}`,
      ...common
    };
  } else if (data.type === 'carousel') {
    return {
      text: ' ',
      type: 'carousel',
      ...common,
      elements: data.items.map(({
        title,
        image,
        subtitle,
        actions
      }) => ({
        title,
        subtitle,
        picture: image ? `${botUrl}${image}` : eval('null'),
        buttons: (actions || []).map(a => {
          if (a.action === 'Say something') {
            return {
              type: 'say_something',
              title: a.title,
              text: a.text
            };
          } else if (a.action === 'Open URL') {
            var _a$url;

            return {
              type: 'open_url',
              title: a.title,
              url: (_a$url = a.url) === null || _a$url === void 0 ? void 0 : _a$url.replace('BOT_URL', botUrl)
            };
          } else if (a.action === 'Postback') {
            return {
              type: 'postback',
              title: a.title,
              payload: a.payload
            };
          } else {
            throw new Error(`Webchat carousel does not support "${a['action']}" action-buttons at the moment`);
          }
        })
      }))
    };
  } else if (data.type === 'text' && data.text.includes('!#select_range')) {
    return { ...data,
      text: data.text.replace('!#select_range', ''),
      type: 'select_range'
    };
  }

  return data;
};

exports.convertPayload = convertPayload;
//# sourceMappingURL=renderer.js.map