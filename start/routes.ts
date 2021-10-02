import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', async () => {
    return { hello: 'world' }
  })
  Route.post('/webhook/telegram', 'API/TelegramWebhookController.handleWebhook')
}).prefix('/api')
