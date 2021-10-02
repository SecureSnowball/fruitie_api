import Axios from 'axios'
import RedGif from 'App/Services/RedGif'
import Logger from '@ioc:Adonis/Core/Logger'

export class RedditPost {
  public id: string
  public nsfw: boolean
  public name: string
  public subreddit: string
  public url: string
  public link: string
  public title: string
  public type: string
  public thumbnail: string
  public author: string
}

class RedditApiWrapper {
  private _axios
  constructor() {
    this._axios = Axios.create({
      baseURL: 'https://api.reddit.com',
    })
  }

  /**
   * Returns hot posts from a subreddit
   * @param subreddit Name of subreddit
   * @param limit limit of posts
   */
  public async getHot({
    subreddit,
    limit,
    keyword,
  }: {
    subreddit: string
    limit: number
    keyword?: string
  }) {
    let posts: RedditPost[] = []
    if (limit > 100) {
      let fetchMorePosts = true
      let totalFetchedPosts = 0
      let after
      while (fetchMorePosts) {
        const pendingPosts = limit - totalFetchedPosts
        const localLimit = pendingPosts > 100 ? 100 : pendingPosts
        const newPosts = await this._fetchPosts({ subreddit, limit: localLimit, after, keyword })
        if (newPosts.length) {
          after = newPosts[newPosts.length - 1].id
          posts = posts.concat(newPosts)
          totalFetchedPosts += localLimit
          fetchMorePosts = totalFetchedPosts !== limit
        } else {
          fetchMorePosts = false
        }
      }
    } else {
      posts = await this._fetchPosts({ subreddit, limit, keyword })
    }
    return posts
  }

  private async _fetchPosts({
    subreddit,
    limit,
    after,
    keyword,
  }: {
    subreddit: string
    limit: number
    after?: string
    keyword?: string
  }) {
    let url = `/r/${subreddit}/hot`
    const params: any = {
      limit,
      include_over_18: 'on',
    }
    if (after) {
      params.after = `t3_${after}`
    }

    if (keyword) {
      url = `/r/${subreddit}/search.json`
      params.restrict_sr = 'on'
      params.q = keyword
    }
    const {
      data: {
        data: { children: postsObject },
      },
    } = await this._axios.get(url, {
      params,
    })
    const posts: RedditPost[] = []

    for (const { data: postData } of postsObject) {
      const url: string = postData.url
      if (url.endsWith('jpg') || url.endsWith('png')) {
        const post = new RedditPost()
        post.name = postData.name
        post.subreddit = subreddit
        post.id = postData.id
        post.url = url
        post.title = postData.title
        post.thumbnail = postData.thumbnail
        post.type = 'image'
        post.nsfw = postData.over_18
        post.author = postData.author
        post.link = `https://reddit.com${postData.permalink}`
        posts.push(post)
      }
      if (url.startsWith('https://v.redd.it/')) {
        try {
          const contentUrl = postData.secure_media.reddit_video.fallback_url
          const post = new RedditPost()
          post.name = postData.name
          post.subreddit = subreddit
          post.id = postData.id
          post.url = contentUrl
          post.title = postData.title
          post.thumbnail = postData.thumbnail
          post.type = 'video'
          post.nsfw = postData.over_18
          post.author = postData.author
          posts.push(post)
        } catch (e) {
          Logger.info(`Unable to parse Reddit video URL: ${url}`)
          Logger.fatal(e)
        }
      }
      if (
        url.startsWith('https://www.redgifs.com/watch/') ||
        url.startsWith('https://redgifs.com/watch/')
      ) {
        try {
          const contentUrl = await RedGif.getMediaUrl(url)
          Logger.info('RedGif URL parsed successfully')
          const post = new RedditPost()
          post.name = postData.name
          post.subreddit = subreddit
          post.id = postData.id
          post.url = contentUrl
          post.title = postData.title
          post.thumbnail = postData.thumbnail
          post.type = 'video'
          post.nsfw = postData.over_18
          post.author = postData.author
          posts.push(post)
        } catch (e) {
          Logger.info(`Unable to parse RedGif URL : ${url}`)
          Logger.fatal(e)
        }
      }
    }
    return posts
  }
}

export default new RedditApiWrapper()
