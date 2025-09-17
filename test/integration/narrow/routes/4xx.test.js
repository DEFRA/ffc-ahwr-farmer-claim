import * as cheerio from 'cheerio'
import { createServer } from '../../../../app/server.js'
import expectPhaseBanner from 'assert'

describe('4xx error pages', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET /unknown route returns 404', async () => {
    const options = {
      method: 'GET',
      url: '/unknown'
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toEqual('404 - Page not found')
    expect($('#_404 div p').text()).toEqual('The page you requested was not found.')
    expectPhaseBanner.ok($)
  })
})
