import ig from 'instagram-scraping'

export class InstagramPost {
  public url: string
}

class InstagramScrapper {
  public async getPosts({ username }: { username: string }) {
    const result = await ig.scrapeUserPage(username)
    const posts: InstagramPost[] = []
    result.medias.forEach((media) => posts.push({ url: media.node.display_url }))
    return posts
  }
}

export default new InstagramScrapper()
