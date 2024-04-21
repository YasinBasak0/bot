import { MultiLangText } from 'botpress/sdk'
import { Dialog360Client } from './client'

export interface Clients {
  [botId: string]: Dialog360Client
}

export interface MessageOption {
  label: string | MultiLangText
  value: string | MultiLangText
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
}
