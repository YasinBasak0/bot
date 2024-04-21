import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'
import Telegraf, { Button, CallbackButton, ContextMessageUpdate, Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import axios from 'axios'
import { Clients, Utils } from './typings'

const outgoingTypes = ['text', 'typing', 'image', 'login_prompt', 'carousel']

export const sendEvent = async (bp: typeof sdk, botId: string, ctx: ContextMessageUpdate, args: { type: string, utils?: Utils }) => {
  // NOTE: getUpdate and setWebhook dot not return the same context mapping
  const threadId = _.get(ctx, 'chat.id') || _.get(ctx, 'message.chat.id')
  const target = _.get(ctx, 'from.id') || _.get(ctx, 'message.from.id')
  const payload: any = { ...ctx.message }

  if (args && args.utils) {
    const { document, photo, voice } = ctx.message
    if (document || photo || voice) {
      const fileId: string = (voice && voice.file_id) || (document && document.file_id) || photo 
        .sort((a, b) => b.file_size - a.file_size)[0].file_id
      payload.attachments = await args.utils.createAttachments(fileId)
      payload.attachments.type = _.get(ctx, 'updateSubTypes[0]')
      delete payload.photo
      delete payload.document
      delete payload.voice
    }
  }

  await bp.events.sendEvent(
    bp.IO.Event({
      botId,
      channel: 'telegram',
      direction: 'incoming',
      payload,
      preview: ctx.message.text,
      threadId: threadId && threadId.toString(),
      target: target && target.toString(),
      ...args
    })
  )
}

export const registerMiddleware = (bp: typeof sdk, outgoingHandler) => {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = telegram.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'telegram.sendMessages',
    order: 100
  })
}

export async function setupBot(bp: typeof sdk, botId: string, clients: Clients, utils: Utils) {
  const client = clients[botId]

  client.start(async ctx => await sendEvent(bp, botId, ctx, { type: 'start' }))
  client.help(async ctx => await sendEvent(bp, botId, ctx, { type: 'help' }))
  client.on('message', async ctx => await sendEvent(bp, botId, ctx, { type: 'message', utils }))
  client.on('callback_query', async ctx => await sendEvent(bp, botId, ctx, { type: 'callback' }))
  // TODO We don't support understanding and accepting more complex stuff from users such as files, audio etc
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  registerMiddleware(bp, outgoingHandler)

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'telegram') {
      return next()
    }

    const client: Telegraf<ContextMessageUpdate> = clients[event.botId]
    if (!client) {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const chatId = event.threadId || event.target

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }
    if (event.payload.type === 'location') {
      await sendLocation(event, client, chatId)
    }
    if (event.payload.type === 'image') {
      await sendImage(event, client, chatId)
    }
    else {
      if (messageType === 'typing') {
        await sendTyping(event, client, chatId)
      } else if (messageType === 'text') {
        let image: any
        if (typeof event.payload.text == 'string') {
          const imgRegex = /#(.*)#/
          image = imgRegex.exec(event.payload.text as string)
          if (image) {
            event.payload.replace = (event.payload.text as string).replace(imgRegex, '')
            image = image[0].slice(1, -1)
          }
        }
        if (image) {
          event.payload.url = image
          await sendImage(event, client, chatId)
        } else {
          await sendTextMessage(event, client, chatId)
        }
      } else if (messageType === 'image') {
        await sendImage(event, client, chatId)
      } else if (messageType === 'carousel') {
        await sendCarousel(event, client, chatId)
      } else {
        // TODO We don't support sending files, location requests (and probably more) yet
        throw new Error(`Message type "${messageType}" not implemented yet`)
      }
    }

    next(undefined, false)
  }
}
async function sendLocation(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const { location } = event.payload
  await client.telegram.sendLocation(chatId, location.latitude, location.longitude);

  /*
  await client.telegram.sen
  if (event.payload.elements && event.payload.elements.length) {
    const { title, picture, subtitle } = event.payload.elements[0]
    const buttons = event.payload.elements.map(x => x.buttons)
    if (picture) {
      await client.telegram.sendChatAction(chatId, 'upload_photo')
      await client.telegram.sendPhoto(chatId, { url: picture, filename: path.basename(picture) })
    }
    const keyboard = keyboardButtons<CallbackButton>(buttons)
    await client.telegram.sendMessage(
      chatId,
      `*${title}*\n${subtitle}`,
      Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
    )
  }
  */
}

async function sendCarousel(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  if (event.payload.elements && event.payload.elements.length) {
    const { title, picture, subtitle } = event.payload.elements[0]
    const buttons = event.payload.elements.map(x => x.buttons)
    if (picture) {
      await client.telegram.sendChatAction(chatId, 'upload_photo')
      await client.telegram.sendPhoto(chatId, { url: picture, filename: path.basename(picture) })
    }
    const keyboard = keyboardButtons<CallbackButton>(buttons)
    await client.telegram.sendMessage(
      chatId,
      `*${title}*\n${subtitle}`,
      Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
    )
  }
}

async function sendTextMessage(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const keyboard = Markup.keyboard(keyboardButtons<Button>(event.payload.quick_replies))
  let sendtext = ''
  if (event.payload.replace) {
    sendtext = event.payload.replace
  } else {
    sendtext = event.preview
  }

  if (event.payload.markdown != false) {
    // Attempt at sending with markdown first, fallback to regular text on failure
    await client.telegram
      .sendMessage(chatId, sendtext, Extra.markdown(true).markup({ ...keyboard, one_time_keyboard: true }))
      .catch(() =>
        client.telegram.sendMessage(
          chatId,
          sendtext,
          Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
        )
      )
  } else {
    await client.telegram.sendMessage(
      chatId,
      sendtext,
      Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
    )
  }
}

async function sendImage(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const keyboard = Markup.keyboard(keyboardButtons<Button>(event.payload.quick_replies))
  const response = await axios.get(event.payload.url, {
    responseType: 'stream'
  })

  const data = { source: response.data }

  if (event.payload.url.toLowerCase().endsWith('.gif')) {
    await client.telegram.sendAnimation(
      chatId,
      data,
      Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
    )
  } else if (
    event.payload.url.toLowerCase().endsWith('.pdf') ||
    event.payload.url.toLowerCase().endsWith('.xlsx') ||
    event.payload.url.toLowerCase().endsWith('.docx')
  ) {
    await client.telegram.sendDocument(
      chatId,
      data,
      Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
    )
  } else {
    await client.telegram.sendPhoto(
      chatId,
      data,
      Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
    )
  }
}

async function sendTyping(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const typing = parseTyping(event.payload.value)
  await client.telegram.sendChatAction(chatId, 'typing')
  await Promise.delay(typing)
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}

function keyboardButtons<T>(arr: any[] | undefined): T[] | undefined {
  if (!arr || !arr.length) {
    return undefined
  }

  const rows = arr[0].length ? arr : [arr]

  return rows.map(
    row =>
      row.map(x => {
        if (x.url) {
          return Markup.urlButton(x.title, x.url)
        }

        return Markup.callbackButton(x.title, x.payload)
      }) as any
  )
}
