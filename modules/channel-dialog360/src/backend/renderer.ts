// noinspection DuplicatedCode

import * as sdk from 'botpress/sdk'

export const convertPayload = (data: any): sdk.Content.All => {
  const { metadata, extraProps } = data
  const botUrl = extraProps?.BOT_URL

  const common = {
    collectFeedback: metadata?.__collectFeedback,
    metadata
  }

  if (data.type === 'image') {
    return {
      type: 'image',
      title: data.title,
      image: `${data.image}`,
      ...common
    }
  } else if (data.type === 'carousel' && data.items) {
    return data
  } else if (data.type === 'carousel') {
    return {
      type: 'carousel',
      ...common,
      items: data.elements.map(({ title, picture, subtitle, buttons }) => ({
        title,
        subtitle,
        image: picture,
        actions: (buttons || []).map(a => {
          if (a.type === 'say_something' || a.type === 'open_url' || a.type === 'postback') {
            return a
          } else {
            throw new Error(`Webchat carousel does not support "${a['action']}" action-buttons at the moment`)
          }
        })
      }))
    }
  }

  return data
}
