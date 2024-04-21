import axios from 'axios'
import Telegraf, { ContextMessageUpdate } from 'telegraf'

import { Config } from '../config'

export type Clients = { [key: string]: Telegraf<ContextMessageUpdate> }

export interface Attachment {
  contentUrl: string
}

interface GetFileApiResult {
  file_id: string
  file_unique_id: string
  file_size: number
  file_path: string
}

interface GetFileApiResponse {
  ok: boolean,
  result: GetFileApiResult
}

export class Utils {

  constructor(
    public config: Config,
    public fileProxyUrlFormat: string
  ) {
  }

  async getTelegramFileUrl(fileId: string, botToken: string): Promise<string> {
    const getFileResponse: GetFileApiResponse = (await axios.get(
      this.config.getFileInfoApiUrlFormat
        .replace('{botToken}', botToken)
        .replace('{file_id}', fileId)
    )).data

    if (!getFileResponse || !getFileResponse.ok) {
      return undefined
    }


    return this.config.fileApiUrlFormat.replace('{botToken}', botToken)
      .replace('{filePath}', getFileResponse.result.file_path)
  }

  async createAttachments(fileId: string): Promise<Attachment[]> {
    const resp = axios.post(("https://api.telegram.org/bot" + this.config.botToken + "/getFile"), {
      file_id: fileId
    });
    var extension = (await resp).data.result.file_path.split('.')[1];
    return [
      {
        contentUrl: this.fileProxyUrlFormat
          .replace('{filePath}', fileId) + '.' + extension
      }
    ]
  }

}
