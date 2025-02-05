import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import router from './adapter/router/router'

const app = new Hono()

app.route('', router)

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) ?? 3010,
})
