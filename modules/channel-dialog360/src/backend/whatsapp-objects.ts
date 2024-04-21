export interface Profile {
  name?: string
}

export interface Contact {
  profile: Profile
  wa_id: string
}

export interface Context {
  from: string
  id: string
}

export interface Identity {
  acknowledged: string
  created_timestamp: number
  hash: string
}

export interface Media {
  caption?: string
  filename?: string
  id: string
  metadata?: any
  mime_type: string
  sha256: string
}

export interface Text {
  body: string
}

export interface Location {
  latitude: number
  longitude: number
  address: string
  name: string
  url: string
}

export interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  country_code?: string
  type?: string
}

export interface Email {
  email?: string
  type?: string
}

export interface Im {
  service?: string
  user_id?: string
}

export interface Name {
  first_name?: string
  middle_name?: string
  last_name?: string
  formatted_name?: string
  'name-prefix'?: string
  name_prefix?: string
  name_suffix?: string
}

export interface Organization {
  company?: string
  department?: string
  title?: string
}

export interface Phone {
  phone?: string
  wa_id?: string
  type?: string
}

export interface Url {
  url?: string
  type?: string
}

export interface WAContact {
  addresses?: Address[]
  birthday?: string
  emails?: Email[]
  ims?: Im[]
  name?: Name[]
  org?: Organization[]
  phones?: Phone[]
  urls?: Url[]
}

export interface Referral {
  headline: string
  body: string
  source_type: string
  source_id: string
  source_url: string
  image?: Media
  video?: Media
}

export interface System {
  body: string
}

export interface ListReply {
  id: string
  title: string
  description: string
}

export interface ButtonReply {
  id: string
  title: string
}

export interface Interactive {
  type: 'list_reply' | 'button_reply'
  list_reply?: ListReply
  button_reply?: ButtonReply
}

export interface Message {
  context?: Context
  from: string
  id: string
  identity?: Identity
  timestamp: string
  type: 'audio' | 'contacts' | 'document' | 'image' | 'location' | 'text' | 'unknown' | 'video' | 'voice' | 'interactive'
  audio?: Media
  contacts?: WAContact[]
  document?: Media
  image?: Media
  location?: Location
  text?: Text
  video?: Media
  voice?: Media
  referral?: Referral
  system?: System
  interactive?: Interactive
}

export interface MessageData {
  contacts?: Contact[]
  messages?: Message[]
}

export interface Conversation {
  id: string
}

export interface Pricing {
  pricing_model: 'CBP' | 'NBP'
  billable: boolean
}

export interface Status {
  id: string
  recipient_id: string
  status: 'read' | 'delivered' | 'sent' | 'failed' | 'deleted'
  timestamp: string
  conversation?: Conversation
  pricing?: Pricing
}

export interface Error {
  code: number
  title: string
  details: string
  href: string
}

export interface WebhookBody {
  messages?: MessageData[]
  statuses?: Status[]
  errors?: Error[]
}

export interface WhatsappMessage {
  recipient_type: 'individual'
  to: string
  type: 'audio' | 'contact' | 'document' | 'image' | 'location' | 'sticker' | 'template' | 'text' | 'video' | 'interactive'
}

export interface LocationMessage extends WhatsappMessage {
  type: 'location',
  location: {
    name?: string,
    address?: string,
    longitude: string,
    latitude: string
  }
}

export interface TextMessage extends WhatsappMessage {
  type: 'text'
  text: {
    body: string
  }
}

export interface ImageMessage extends WhatsappMessage {
  type: 'image'
  image: {
    link: string
    caption: string
  }
}

export interface MessageButton {
  type: 'reply'
  reply: {
    title: string
    id: string
  }
}

export interface ButtonsMessage extends WhatsappMessage {
  type: 'interactive'
  interactive: {
    type: 'button'
    body: {
      text: string
    },
    action: {
      buttons: MessageButton[]
    }
  }
}

export interface ListSectionRow {
  id: string
  title: string
  description: string
}

export interface ListSection {
  title: string
  rows: ListSectionRow[]
}

export interface ListMessage extends WhatsappMessage {
  type: 'interactive'
  interactive: {
    type: 'list'
    body: {
      text: string
    },
    action: {
      button: string
      sections: ListSection[]
    }
  }
}
