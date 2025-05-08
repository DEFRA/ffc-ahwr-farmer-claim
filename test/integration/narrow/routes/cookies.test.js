import { createServer } from '../../../../app/server.js'
import expectPhaseBanner from 'assert'

import cheerio from 'cheerio'

jest.mock('../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../app/config')
  return {
    config: {
      ...originalModule.config,
      dateOfTesting: {
        enabled: false
      }
    }
  }
})

describe('cookies route', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET /claim/cookies returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/claim/cookies'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /claim/cookies returns cookie policy', async () => {
    const options = {
      method: 'GET',
      url: '/claim/cookies'
    }

    const result = await server.inject(options)
    expect(result.request.response.variety).toBe('view')
    expect(result.request.response.source.template).toBe('cookies/cookie-policy')
  })

  test('GET /claim/cookies context includes Header', async () => {
    const options = {
      method: 'GET',
      url: '/claim/cookies'
    }

    const result = await server.inject(options)
    expect(result.request.response._payload._data).toContain('Cookies')
  })

  test('POST /claim/cookies returns 302 if not async', async () => {
    const options = {
      method: 'POST',
      url: '/claim/cookies',
      payload: { analytics: true }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(302)
  })

  test('POST /claim/cookies returns 200 if async', async () => {
    const options = {
      method: 'POST',
      url: '/claim/cookies',
      payload: { analytics: true, async: true }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('POST /claim/cookies invalid returns 400', async () => {
    const options = {
      method: 'POST',
      url: '/claim/cookies',
      payload: { invalid: 'aaaaaa' }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('POST /claim/cookies redirects to GET with querystring', async () => {
    const options = {
      method: 'POST',
      url: '/claim/cookies',
      payload: { analytics: true }
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(302)
    expect(result.headers.location).toBe('/claim/cookies?updated=true')
  })

  test('Cookie banner appears when no cookie option selected', async () => {
    const options = {
      method: 'GET',
      url: '/claim/cookies'
    }
    const response = await server.inject(options)
    expect(response.statusCode).toBe(200)
    const $ = cheerio.load(response.payload)
    expect($('.govuk-cookie-banner h2').text()).toContain('Get funding to improve animal health and welfare')
    expect($('.js-cookies-button-accept').text()).toContain('Accept analytics cookies')
    expect($('.js-cookies-button-reject').text()).toContain('Reject analytics cookies')
    expectPhaseBanner.ok($)
  })
})
