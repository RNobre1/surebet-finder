export interface OddsApiKeyConfig {
  key: string
  bookmakers: string[]
}

export function getOddsApiKeys(): OddsApiKeyConfig[] {
  const envValue = process.env.ODDS_API_KEYS

  if (!envValue) {
    throw new Error('Missing or invalid ODDS_API_KEYS environment variable.')
  }

  try {
    const keys = JSON.parse(envValue) as OddsApiKeyConfig[]
    if (!Array.isArray(keys) || keys.length === 0) {
       throw new Error('Missing or invalid ODDS_API_KEYS')
    }
    return keys
  } catch (error) {
    throw new Error('Missing or invalid ODDS_API_KEYS: ' + error)
  }
}
