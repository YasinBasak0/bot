import axios from 'axios'
import { Content } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'

import { Config } from '../config'
import { convertPayload } from './renderer'
import mime from 'mime-types'

import { Clients, MessageOption } from './typings'
import {
  ButtonsMessage,
  ImageMessage, ListMessage, ListSectionRow, Media,
  MessageButton,
  MessageData,
  TextMessage,
  WhatsappMessage,
  LocationMessage
} from './whatsapp-objects'

const debug = DEBUG('channel-dialog360')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'dialog360.sendMessage'

export class Dialog360Client {
  private logger: sdk.Logger
  private kvs: sdk.KvsService
  private authKey: string
  private webhookUrl: string

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: sdk.http.RouterExtension,
    private route: string
  ) {
    this.logger = bp.logger.forBot(botId)
  }

  static trimSlashes(str: string): string {
    if (!str) {
      return str
    }
    return str.replace(/^\/+|\/+$/, '')
  }

  getApiUrl(action: string): string {
    return this.config.apiUrlFormat
      .replace('{baseUrl}', Dialog360Client.trimSlashes(this.config.baseUrl))
      .replace('{apiVersion}', Dialog360Client.trimSlashes(this.config.apiVersion))
      .replace('{action}', Dialog360Client.trimSlashes(action))
  }

  async postApiCall(action: string, body: any): Promise<any> {
    return (await axios.post(this.getApiUrl(action), body, {
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': this.config.apiKey
      }
    })).data
  }

  async setWebHookUrl(webhookUrl: string) {
    debug(`Setting %s as webhookUrl to Dialog360`, webhookUrl)
    const result = await this.postApiCall('configs/webhook', {
      url: webhookUrl,
      headers: {
        'x-qb-signature': this.authKey
      }
    })
    debug('Webhook url set on Dialog360: %o', result)
    return result
  }

  async initialize() {
    if (!this.config.baseUrl || !this.config.apiKey) {
      return this.logger.error(`[${this.botId}] The baseUrl and apiKey must be configured to use this channel.`)
    }

    const url = (await this.router.getPublicPath()) + this.route
    const webhookUrl = this.webhookUrl = url.replace('BOT_ID', this.botId)
    this.authKey = crypto.randomBytes(128).toString('base64')
    this.kvs = this.bp.kvs.forBot(this.botId)

    await this.setWebHookUrl(webhookUrl)

    debug('Dialog360 webhook listening at %s', webhookUrl)
  }

  auth(req): boolean {
    const signature = req.headers['x-qb-signature']
    debug(`Authenticating for %o`, { signature, existing: this.authKey })
    return this.authKey === signature
  }

  getKvsKey(target: string, threadId: string) {
    return `${target}_${threadId}`
  }

  getMediaUrl(media_id: string): string {
    return this.getApiUrl(`media/${media_id}`)
  }

  getPublicMediaUrl(media: Media) {
    return `${this.webhookUrl.replace(/\/+$/, '')}/media/${media.id}.${mime.extension(media.mime_type)}`
  }

  getApiKey(): string {
    return this.config.apiKey
  }

  async handleWebhookRequest(body: MessageData) {
    debugIncoming(`Received message `, JSON.stringify(body, undefined, 2))
    if (!body || !body.messages) {
      return
    }
    for (const msg of body.messages) {
      let payload: any = undefined
      let index: number

      switch (msg.type) {
        case 'interactive':
          switch (msg.interactive.type) {
            case 'button_reply':
              index = Number(msg.interactive.button_reply.id)
              payload = await this.handleIndexReponse(index - 1, body.contacts[0].wa_id, msg.from)
              if (!payload || payload.type === 'url') {
                continue
              }
              break
            case 'list_reply':
              index = Number(msg.interactive.list_reply.id)
              payload = await this.handleIndexReponse(index - 1, body.contacts[0].wa_id, msg.from)
              if (!payload || payload.type === 'url') {
                continue
              }
              break
          }
          break
        case 'text':
          const text: string = msg.text.body
          payload = { type: 'text', text }
          break
        case 'image':
          payload = { type: 'image', title: msg.image.filename, contentUrl: this.getPublicMediaUrl(msg.image) }
          debugIncoming('Served image: %o', payload)
          break
        case 'location':
          const location: any = msg.location
          payload = { type: 'location', text: 'location', location }
          break
        case 'document':
          payload = { type: 'document', title: msg.document.caption, contentUrl: this.getPublicMediaUrl(msg.document) }
          break
        case 'audio':
          payload = { type: 'audio', title: msg.audio.mime_type, contentUrl: this.getPublicMediaUrl(msg.audio) }
          break
        case 'voice':
          //payload = [{ type: 'voice', title: msg.voice.mime_type, contentUrl: this.getPublicMediaUrl(msg.voice) }]
          let attachments = [{contentUrl: await this.getPublicMediaUrl(msg.voice), type: "voice"}]
          payload = { type: 'voice', title: msg.voice.mime_type, attachments: attachments}
        break
        case 'contacts':
          var phone: string = JSON.stringify(msg.contacts)
          const obj: any = phone.substring(1, phone.length - 1)
          const obj2: any = JSON.parse(obj)
          payload = { type: 'contacts', info: JSON.stringify(obj2) }
          break
        case 'video':
          payload = { type: 'audio', title: msg.video.mime_type, contentUrl: this.getPublicMediaUrl(msg.video) }
          break
      }

      if (payload) {
        await this.bp.events.sendEvent(
          this.bp.IO.Event({
            botId: this.botId,
            channel: 'dialog360',
            direction: 'incoming',
            type: payload.type,
            payload,
            threadId: msg.from,
            target: body.contacts[0].wa_id
          })
        )
      }
    }
  }

  async handleIndexReponse(index: number, target: string, threadId: string): Promise<any> {
    const key = this.getKvsKey(target, threadId)
    if (!(await this.kvs.exists(key))) {
      return
    }

    const option = await this.kvs.get(key, `[${index}]`)
    if (!option) {
      return
    }

    await this.kvs.delete(key)

    const { type, label, value } = option
    return {
      type,
      text: type === 'say_something' ? value : label,
      payload: value
    }
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    let image: any

    if (typeof event.payload.text == 'string') {
      const imgRegex = /#(.*)#/
      image = imgRegex.exec(event.payload.text as string)
      if (image) {
        event.payload.title = (event.payload.text as string).replace(imgRegex, '')
        event.payload.image = image[0].slice(1, -1)
        event.payload.type = 'image'
      }
    }
    const payload = event.payload = convertPayload(event.payload)

    if (!event.threadId) {
      event.threadId = 'whatsapp:' + this.config.fromNumber
    }

    let { __buttons, __dropdown } = payload.metadata ?? { __buttons: undefined, __dropdown: undefined }

    if (payload['quick_replies'] && !(__buttons || __dropdown)) {
      __buttons = __dropdown = payload['quick_replies'].map(t => {
        return { title: t.title, value: t.payload }
      })
    }

    if (__dropdown || __buttons) {
      await this.sendChoices(event, __buttons || <sdk.Option[]>__dropdown)
    } else if (payload.type === 'text') {
      await this.sendTextMessage(event, payload.text as string)
    } else if (payload.type === 'image') {
      await this.sendImage(event, event.payload.image, event.payload.title)
    } else if (payload.type === 'carousel') {
      await this.sendCarousel(event, payload)
    }
    if (event.payload.type === 'location') {
      await this.sendLocation(event, event.payload.location.longitude, event.payload.location.latitude, event.payload.text, event.payload.address)
    }
    next(undefined, false)
  }

  async sendChoices(event: sdk.IO.Event, choices) {
    const options: MessageOption[] = choices.map(x => ({
      label: x.title,
      value: x.value,
      type: 'quick_reply'
    }))
    await this.sendOptions(event, event.payload.text, options)
  }

  async sendCarousel(event: sdk.IO.Event, payload: sdk.Content.Carousel) {
    const options: MessageOption[] = []

    if (event.payload.text) {
      await this.sendTextMessage(event, event.payload.text)
    }

    for (const { subtitle, title, image, actions } of payload.items) {

      let text: string = `*${title}*\n_${subtitle}_`

      for (const action of actions || []) {
        if (action.type === 'open_url') {
          text += `\n${action.title ? action.title + ': ' : ''}${action.url}`
        } else if (action.type === 'postback') {
          text += `\n${options.length + 1}. *${action.title}*`
          options.push({ label: action.title, value: action.payload, type: 'postback' })
        } else if (action.type === 'say_something') {
          text += `\n${options.length + 1}. *${action.title}*`
          options.push({ label: action.title, value: action.text, type: 'say_something' })
        }
      }

      if (image) {
        await this.sendImage(event, image, text)
      } else {
        await this.sendTextMessage(event, text)
      }
    }
    if (options.length) {
      await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')
    }
  }

  async sendOptions(event: sdk.IO.Event, text: string, options: MessageOption[]) {
    let body = text
    if (options.length) {
      body = `${text}\n\n${options.map(({ label }, idx) => `${idx + 1}. ${label}`).join('\n')}`
    }

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    if (options.length) {
      if (options.length <= 3) {
        await this.sendButtons(event, text, options)
      } else if (options.length <= 10) {
        await this.sendList(event, text, options)
      } else {
        await this.sendTextMessage(event, body)
      }
    }
  }

  async sendTextMessage(event: sdk.IO.Event, body: string) {
    const message: TextMessage = {
      recipient_type: 'individual',
      type: 'text',
      to: event.target,
      text: {
        body
      }
    }
    return await this.postMessage(message)
  }

  async sendList(event: sdk.IO.Event, text: string, options: MessageOption[]) {
    const message: ListMessage = {
      recipient_type: 'individual',
      type: 'interactive',
      to: event.target,
      interactive: {
        type: 'list',
        body: {
          text
        },
        action: {
          button: 'Options',
          sections: [{
            title: 'Please select one',
            rows: options.map((option, idx) => {
              return {
                title: option.label,
                description: '',
                id: String(idx + 1)
              } as ListSectionRow
            })
          }]
        }
      }
    }
    return await this.postMessage(message)
  }

  async sendButtons(event: sdk.IO.Event, text: string, options: MessageOption[]) {
    const message: ButtonsMessage = {
      recipient_type: 'individual',
      type: 'interactive',
      to: event.target,
      interactive: {
        type: 'button',
        body: {
          text
        },
        action: {
          buttons: options.map((option, idx) => {
            return {
              type: 'reply',
              reply: {
                title: option.label,
                id: String(idx + 1)
              }
            } as MessageButton
          })
        }
      }
    }
    return await this.postMessage(message)
  }

  async sendImage(event: sdk.IO.Event, link: string, caption: string) {
    const message: ImageMessage = {
      recipient_type: 'individual',
      type: 'image',
      to: event.target,
      image: {
        link,
        caption
      }
    }
    return await this.postMessage(message)
  }

  async sendLocation(event: sdk.IO.Event, longitude: string, latitude: string, name: string, address: string) {
    const message: LocationMessage = {
      recipient_type: 'individual',
      type: 'location',
      to: event.target,
      location: {
        name,
        address,
        longitude,
        latitude
      }
    }
    return await this.postMessage(message)
  }

  async sendMessage(event: sdk.IO.Event, args: any) {

    debugOutgoing(`Sending message %o`, args)
  }

  async postMessage(message: WhatsappMessage) {
    debugOutgoing(`Sending message %o`, message)
    return await this.postApiCall('messages', message)
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Dialog360.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'dialog360') {
      return next()
    }

    const client: Dialog360Client = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}
