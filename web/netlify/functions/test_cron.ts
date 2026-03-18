import type { Handler, Config } from '@netlify/functions'

export const config: Config = {
  schedule: '* * * * *',
}

export const handler: Handler = async () => {
  console.log('--- TEST CRON TRIGGERED ---')
  console.log('Time:', new Date().toISOString())
  return { statusCode: 200 }
}
