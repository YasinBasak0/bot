import * as sdk from 'botpress/sdk'
import { Twilio, validateRequest } from 'twilio'
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'

import { Config } from '../config'

import { Clients, MessageOption, TwilioRequestBody } from './typings'
import bodyParser from 'body-parser'

const debug = DEBUG('channel-twilio')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'twilio.sendMessage'

export class TwilioClient {
  private logger: sdk.Logger
  private twilio: Twilio
  private webhookUrl: string
  private kvs: sdk.KvsService

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: sdk.http.RouterExtension,
    private route: string
  ) {
    this.logger = bp.logger.forBot(botId)
  }

  async initialize() {
    if (!this.config.accountSID || !this.config.authToken) {
      return this.logger.error(`[${this.botId}] The accountSID and authToken must be configured to use this channel.`)
    }

    const url = (await this.router.getPublicPath()) + this.route
    this.webhookUrl = url.replace('BOT_ID', this.botId)

    this.twilio = new Twilio(this.config.accountSID, this.config.authToken)
    this.kvs = this.bp.kvs.forBot(this.botId)

    this.logger.info(`Twilio webhook listening at ${this.webhookUrl}`)
  }

  auth(req): boolean {
    const signature = req.headers['x-twilio-signature']
    return validateRequest(this.config.authToken, signature, this.webhookUrl, req.body)
  }

  getKvsKey(target: string, threadId: string) {
    return `${target}_${threadId}`
  }

  async handleWebhookRequest(body: TwilioRequestBody) {
    debugIncoming(`Received message %o`, body)

    const threadId = body.To
    const target = body.From
    const text = body.Body



    const {
      Latitude,
      Longitude
    } = body

    const index = Number(text)
    let payload: any = { type: 'text', text }

    if (Latitude || Longitude) {
      payload.text = 'Location'
      payload.type = "Location"
      payload.location = {
        Latitude,
        Longitude
      }
    }
    else if (Number(body.NumMedia) > 0) {
      payload.text = body.Body;
      payload.type = "Media";
      payload.media = {
        contentType: body.MediaContentType0,
        url: body.MediaUrl0
      }
    }

    if (index) {
      payload = (await this.handleIndexReponse(index - 1, target, threadId)) ?? payload
      if (payload.type === 'url') {
        return
      }
    }

    await this.kvs.delete(this.getKvsKey(target, threadId))

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'twilio',
        direction: 'incoming',
        type: payload.type,
        payload,
        threadId,
        target
      })
    )
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
    const payload = event.payload as sdk.Content.All

    const { __buttons, __dropdown } = payload.metadata

    if (!event.threadId) {
      event.threadId = 'whatsapp:' + this.config.fromNumber
    }

    if (__buttons || __dropdown) {
      await this.sendChoices(event, __buttons || <sdk.Option[]>__dropdown)
    } else if (payload.type === 'text') {
      var image;

      if (typeof payload.text == "string") {

        const imgRegex = /#(.*)#/;

        var image: any = imgRegex.exec(payload.text as string);

        if (image) {
          payload.text = (payload.text as string).replace(imgRegex, '')
          image = image[0].slice(1, -1)
        }

      }

      var args: {
        body: any,
        mediaUrl?: string
      } = {
        body: payload.text
      };

      if (image) {
        args.mediaUrl = image
      }

      await this.sendMessage(event, args)
    } else if (payload.type === 'image') {
      await this.sendMessage(event, {
        body: event.payload.title,
        mediaUrl: [`${payload.extraProps.BOT_URL}${payload.image}`]
      })
    } else if (payload.type === 'carousel') {
      await this.sendCarousel(event, payload)
    }
    next(undefined, false)
  }

  async sendChoices(event: sdk.IO.Event, choices) {
    console.log(choices)

    const options: MessageOption[] = choices.map(x => ({
      label: x.title,
      value: x.value,
      type: 'quick_reply'
    }))
    await this.sendOptions(event, event.payload.text, {}, options)
  }

  async sendCarousel(event: sdk.IO.Event, payload: sdk.Content.Carousel) {
    for (const { subtitle, title, image, actions } of payload.items) {
      const body = `${title}\n\n${subtitle ? subtitle : ''}`

      const options: MessageOption[] = []
      for (const action of actions || []) {
        const title = action.title as string

        if (action.action === 'Open URL') {
          options.push({ label: `${title} : ${action.url}`, value: undefined, type: 'url' })
        } else if (action.action === 'Postback') {
          options.push({ label: title, value: action.payload, type: 'postback' })
        } else if (action.action === 'Say something') {
          options.push({ label: title, value: action.text as string, type: 'say_something' })
        }
      }

      const args = { mediaUrl: image ? [`${payload.extraProps.BOT_URL}${image}`] : undefined }
      await this.sendOptions(event, body, args, options)
    }
  }

  async sendOptions(event: sdk.IO.Event, text: string, args: any, options: MessageOption[]) {
    let body = text
    if (options.length) {
      body = `${text}\n\n${options.map(({ label }, idx) => `${idx + 1}. ${label}`).join('\n')}`
    }

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    await this.sendMessage(event, { ...args, body })
  }

  async sendMessage(event: sdk.IO.Event, args: any) {
    const message: MessageInstance = {
      ...args,
      provideFeedback: false,
      from: event.threadId,
      to: event.target
    }

    debugOutgoing(`Sending message %o`, message)

    await this.twilio.messages.create(message)
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Twilio.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'twilio') {
      return next()
    }

    const client: TwilioClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}