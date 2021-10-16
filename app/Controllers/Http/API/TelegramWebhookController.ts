import Logger from '@ioc:Adonis/Core/Logger'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Reddit, { RedditPost } from 'App/Services/Reddit'
import Instagram, { InstagramPost } from 'App/Services/Instagram'
import Telegram, { TelegramPostPayload } from 'App/Services/Telegram'

export default class TelegramWebhookController {
  private _start = `*Bot is under construction*

*To get posts use the following syntax*
\`\`\`
/r <subreddit> <count>
/r programmerhumor 25
\`\`\`
\`\`\`
/r programmerhumor 25
\`\`\`

*To search posts use the following syntax*
\`\`\`
/r s <subreddit> <keyword> <count>
\`\`\`
\`\`\`
/r s programmerhumor Java 25
\`\`\``

  private _disabledSubredditMessage = `Only available in DM, disabled for groups`

  private _disabledSubreddits = [
    'androgynoushotties',
    'cock',
    'cocks',
    'dicks',
    'femboy',
    'gay',
    'gaynsfw',
    'gayporn',
    'trap',
    'traphentai',
    'yaoi',
  ]

  private _subreddits = [
    'aww',
    'eyebleach',
    'earthporn',
    'unixporn',
    'programmerhumor',
    'memes',
    'dankmemes',
    'mademesmile',
    'wholesomememes',
    'natureisfuckinglit',
  ]

  private _getPageSize(str) {
    let number = 10
    const match = str.match(/\d+$/)
    if (match) number = parseInt(match[0])
    if (number > 1000) return 1000
    return number
  }

  public async handleWebhook({ request, response }: HttpContextContract) {
    try {
      const payload = request.all()
      const message = payload.message.text

      const postPayload = new TelegramPostPayload()
      const chatId = payload.message.chat.id
      const messageId = payload.message.message_id

      let effectiveQuery
      let keyword
      let subreddit: string
      let pageSize
      if (message.startsWith('/r')) {
        if (message === '/rrandom') {
          subreddit = this._subreddits[Math.floor(Math.random() * this._subreddits.length)]
          subreddit = subreddit.toLowerCase()
          this._fetchAndReplyRedditPosts({
            subreddit,
            pageSize: 10,
            chatId,
            messageId,
          })
        } else {
          effectiveQuery = message.replace('/r ', '')
          pageSize = this._getPageSize(effectiveQuery)
          if (effectiveQuery.startsWith('s ')) {
            effectiveQuery = effectiveQuery.replace('s ', '')
            const queryParts = effectiveQuery.split(' ')
            subreddit = queryParts.shift()
            subreddit = subreddit.toLowerCase()
            if (this._disabledSubreddits.includes(subreddit) && chatId < 0) {
              postPayload.chatId = chatId
              postPayload.messageId = messageId
              postPayload.text = this._disabledSubredditMessage
              Telegram.sendMessage(postPayload)
            } else {
              if (effectiveQuery.endsWith(pageSize)) {
                queryParts.pop()
              }
              keyword = queryParts.join(' ')
              this._fetchAndReplyRedditPosts({
                subreddit,
                pageSize,
                chatId,
                messageId,
                keyword,
              })
            }
          } else {
            subreddit = effectiveQuery.split(' ')[0]
            subreddit = subreddit.toLowerCase()
            if (this._disabledSubreddits.includes(subreddit) && chatId < 0) {
              postPayload.chatId = chatId
              postPayload.messageId = messageId
              postPayload.text = this._disabledSubredditMessage
              Telegram.sendMessage(postPayload)
            } else {
              this._fetchAndReplyRedditPosts({
                subreddit,
                pageSize,
                chatId,
                messageId,
              })
            }
          }
        }
      } else if (message === '/start') {
        Logger.info('No match')
        postPayload.chatId = chatId
        postPayload.messageId = messageId
        postPayload.text = this._start
        Telegram.sendMessage(postPayload)
      } else if (message.startsWith('/i ')) {
        const username = message.replace('/i ', '')
        this._fetchAndReplyInstagramPosts({
          username,
          chatId,
          messageId,
        })
      }
      response.send({ message: 'Processing...' })
    } catch (e) {
      response.send({ message: 'Failed...' })
    }
  }

  private async _fetchAndReplyRedditPosts({
    subreddit,
    pageSize,
    messageId,
    chatId,
    keyword,
  }: {
    subreddit: string
    keyword?: string
    pageSize: number
    messageId: number
    chatId: number
  }) {
    try {
      const posts: RedditPost[] = await Reddit.getHot({ subreddit, limit: pageSize, keyword })
      Logger.info(
        {
          subreddit,
          pageSize,
          messageId,
          chatId,
          keyword,
        },
        `${posts.length} results`
      )
      if (!posts.length) {
        const postPayload = new TelegramPostPayload()
        postPayload.chatId = chatId
        postPayload.messageId = messageId
        postPayload.text = 'No results found'
        return Telegram.sendMessage(postPayload)
      }
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        const telegramPostPayload = new TelegramPostPayload()
        telegramPostPayload.chatId = chatId
        telegramPostPayload.messageId = messageId
        telegramPostPayload.imageUrl = post.url
        telegramPostPayload.thumbnail = post.thumbnail
        telegramPostPayload.videoUrl = post.url
        telegramPostPayload.text = `ID: ${post.id}
Caption: ${post.title}
Original: ${post.url},
Visit: ${post.link}`
        try {
          if (post.type === 'video') await Telegram.sendVideo(telegramPostPayload)
          else await Telegram.sendImage(telegramPostPayload)
        } catch (e) {
          if (e?.response?.status === 429) {
            const retryAfter = e?.response?.data?.parameters?.retry_after || 60
            Logger.info(`Sleeping for ${retryAfter} seconds`)
            await this._sleep(retryAfter * 1000)
            i--
          }
        }
      }
    } catch (e) {
      // Add invalid subreddit and 0 matchin posts found handling
      Logger.fatal(e)
    }
  }

  private async _fetchAndReplyInstagramPosts({
    username,
    chatId,
    messageId,
  }: {
    username: string
    messageId: number
    chatId: number
  }) {
    try {
      const posts: InstagramPost[] = await Instagram.getPosts({ username })
      Logger.info(
        {
          username,
          messageId,
          chatId,
        },
        `${posts.length} results`
      )

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        const telegramPostPayload = new TelegramPostPayload()
        telegramPostPayload.chatId = chatId
        telegramPostPayload.messageId = messageId
        telegramPostPayload.imageUrl = post.url
        try {
          Telegram.sendImage(telegramPostPayload)
        } catch (e) {
          if (e?.response?.status === 429) {
            const retryAfter = e?.response?.data?.parameters?.retry_after || 60
            Logger.info(`Sleeping for ${retryAfter} seconds`)
            await this._sleep(retryAfter * 1000)
            i--
          }
        }
      }
    } catch (e) {
      Logger.fatal(e)
    }
  }

  private async _sleep(ms) {
    return new Promise((_) => setTimeout(_, ms))
  }
}
