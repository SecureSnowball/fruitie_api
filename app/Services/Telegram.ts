import Axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
// import Logger from '@ioc:Adonis/Core/Logger'

export class TelegramPostPayload {
  public chatId: number
  public messageId: number
  public text: string
  public imageUrl?: string
  public videoUrl?: string
  public thumbnail?: string
}

class TelegramApiWrapper {
  private _axios
  constructor() {
    this._axios = Axios.create({
      baseURL: `https://api.telegram.org/bot${Env.get('TELEGRAM_TOKEN')}`,
    })
  }

  public async sendMessage(postPayload: TelegramPostPayload) {
    return this._axios.post('/sendMessage', {
      chat_id: postPayload.chatId,
      text: postPayload.text,
      reply_to_message_id: postPayload.messageId,
      parse_mode: 'MarkdownV2',
    })
  }

  public async sendImage(postPayload: TelegramPostPayload) {
    return this._axios.post('/sendPhoto', {
      chat_id: postPayload.chatId,
      caption: postPayload.text,
      reply_to_message_id: postPayload.messageId,
      photo: postPayload?.imageUrl,
      disable_notification: true,
    })
  }

  public async sendVideo(postPayload: TelegramPostPayload) {
    return this._axios.post('/sendVideo', {
      chat_id: postPayload.chatId,
      caption: postPayload.text,
      reply_to_message_id: postPayload.messageId,
      video: postPayload?.videoUrl,
      thumb: postPayload?.thumbnail,
      disable_notification: true,
    })
  }
}

export default new TelegramApiWrapper()
