const _ = require('lodash')

const channels = ['api', 'web', 'excel']
if (event.payload.quick_replies && channels.includes(event.channel)) {
  event.payload = {
    type: 'custom',
    module: 'channel-excel',
    component: 'QuickReplies',
    quick_replies: event.payload.quick_replies,
    wrapped: {
      type: 'text',
      ..._.omit(event.payload, 'quick_replies')
    }
  }
  event.type = 'custom'
}
