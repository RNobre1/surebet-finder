import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getOddsApiKeys } from '../../netlify/functions/lib/api_keys'

describe('API Keys Config Parser', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should parse valid JSON configuration correctly', () => {
    process.env.ODDS_API_KEYS = JSON.stringify([
      { key: 'key1', bookmakers: ['betano', 'bet365'] },
      { key: 'key2', bookmakers: ['sportingbet', 'betfair_sb_uk'] }
    ])

    const keys = getOddsApiKeys()
    
    expect(keys).toHaveLength(2)
    expect(keys[0].key).toBe('key1')
    expect(keys[0].bookmakers).toEqual(['betano', 'bet365'])
    expect(keys[1].key).toBe('key2')
    expect(keys[1].bookmakers).toContain('betfair_sb_uk')
  })

  it('should fallback gracefully or throw if ODDS_API_KEYS is missing', () => {
    delete process.env.ODDS_API_KEYS

    expect(() => getOddsApiKeys()).toThrowError(/Missing or invalid ODDS_API_KEYS/)
  })

  it('should fail if JSON is invalid', () => {
    process.env.ODDS_API_KEYS = '{ invalid json'

    expect(() => getOddsApiKeys()).toThrowError(/Missing or invalid ODDS_API_KEYS/)
  })
})
