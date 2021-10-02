import Axios from 'axios'
import { parse } from 'node-html-parser'
// import Logger from '@ioc:Adonis/Core/Logger'

class RedGif {
  private _axios
  constructor() {
    this._axios = Axios.create({})
  }
  public async getMediaUrl(page = 'https://www.redgifs.com/watch/strangeplayfulaxisdeer') {
    const { data: html } = await this._axios.get(page)
    const document = parse(html)
    return JSON.parse(
      document.querySelector('script[type="application/ld+json"]').childNodes[0].rawText
    ).video.contentUrl
  }
}

export default new RedGif()
