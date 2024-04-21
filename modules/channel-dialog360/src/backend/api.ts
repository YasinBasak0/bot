import * as sdk from 'botpress/sdk'

import https from 'https'
import { Clients } from './typings'

export async function setupRouter(bp: typeof sdk, clients: Clients, route: string): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot('channel-dialog360', {
    checkAuthentication: false
  })

  router.post(route, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send('Bot not a Dialog360 bot')
    }

    if (client.auth(req)) {
      await client.handleWebhookRequest(req.body)
      res.status(200).send()
    } else {
      res.status(401).send('Auth token invalid')
    }
  }).get(`${route}/media/:media_id`, async(req, res) => {
    const { botId, media_id } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send('Bot not a Dialog360 bot')
    }

    const fileName = media_id.substr(0, media_id.lastIndexOf('.'))
    const ext = media_id.substr(media_id.lastIndexOf('.'))

    const proxy = https.get(client.getMediaUrl(fileName), {
      headers: {
        'D360-API-KEY': client.getApiKey()
      }
    }, proxyRes => {
      proxyRes.headers['content-disposition'] = `attachment; filename="file${ext}"`
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, {
        end: true
      })
    })

    req.pipe(proxy, {
      end: true
    })
  })

  return router
}
