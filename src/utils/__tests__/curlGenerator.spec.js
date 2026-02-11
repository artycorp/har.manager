import { describe, it, expect } from 'vitest'
import { generateCurl, copyToClipboard } from '../curlGenerator'

describe('generateCurl', () => {
  it('generates GET with headers', () => {
    const entry = {
      request: {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [
          { name: 'Accept', value: 'application/json' },
          { name: 'Authorization', value: 'Bearer token123' },
        ],
      },
    }
    const curl = generateCurl(entry)
    expect(curl).toContain("curl -X GET 'https://api.example.com/users'")
    expect(curl).toContain("-H 'Accept: application/json'")
    expect(curl).toContain("-H 'Authorization: Bearer token123'")
  })

  it('generates POST with body', () => {
    const entry = {
      request: {
        method: 'POST',
        url: 'https://api.example.com/login',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        postData: { text: '{"username":"admin"}' },
      },
    }
    const curl = generateCurl(entry)
    expect(curl).toContain("curl -X POST 'https://api.example.com/login'")
    expect(curl).toContain("-d '{\"username\":\"admin\"}'")
  })

  it('skips Host, Connection, Content-Length, User-Agent headers', () => {
    const entry = {
      request: {
        method: 'GET',
        url: 'https://api.example.com/',
        headers: [
          { name: 'Host', value: 'api.example.com' },
          { name: 'Connection', value: 'keep-alive' },
          { name: 'Content-Length', value: '100' },
          { name: 'User-Agent', value: 'Mozilla/5.0' },
          { name: 'Accept', value: '*/*' },
        ],
      },
    }
    const curl = generateCurl(entry)
    expect(curl).not.toContain('Host:')
    expect(curl).not.toContain('Connection:')
    expect(curl).not.toContain('Content-Length:')
    expect(curl).not.toContain('User-Agent:')
    expect(curl).toContain("-H 'Accept: */*'")
  })

  it('escapes single quotes in header values', () => {
    const entry = {
      request: {
        method: 'GET',
        url: 'https://api.example.com/',
        headers: [{ name: 'X-Custom', value: "it's a test" }],
      },
    }
    const curl = generateCurl(entry)
    expect(curl).toContain("it'\\''s a test")
  })

  it('escapes single quotes in body', () => {
    const entry = {
      request: {
        method: 'POST',
        url: 'https://api.example.com/',
        headers: [],
        postData: { text: "{'key': 'value'}" },
      },
    }
    const curl = generateCurl(entry)
    expect(curl).toContain("-d '{'\\''key'\\'': '\\''value'\\''}'")
  })

  it('returns empty string for null entry', () => {
    expect(generateCurl(null)).toBe('')
    expect(generateCurl(undefined)).toBe('')
  })

  it('returns empty string for entry without request', () => {
    expect(generateCurl({})).toBe('')
    expect(generateCurl({ request: null })).toBe('')
  })

  it('handles entry with no headers', () => {
    const entry = {
      request: {
        method: 'GET',
        url: 'https://api.example.com/',
        headers: [],
      },
    }
    const curl = generateCurl(entry)
    expect(curl).toBe("curl -X GET 'https://api.example.com/'")
  })
})

describe('copyToClipboard', () => {
  it('calls navigator.clipboard.writeText', async () => {
    const result = await copyToClipboard('test text')
    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })
})
