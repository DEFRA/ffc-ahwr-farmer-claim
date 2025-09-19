import { StatusCodes } from 'http-status-codes'
import { createServer } from '../../../../app/server.js'
import { getEndemicsClaim } from '../../../../app/session/index.js'
import * as cheerio from 'cheerio'

jest.mock('../../../../app/session/index.js')

describe('Missing routes', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET an unregistered route when user is signed out', async () => {
    const options = {
      method: 'GET',
      url: '/random-route'
    }

    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND)

    expect($('h1').text()).toMatch('404 - Page not found')
    expect($('p:nth-child(2) > a').text().trim()).toContain('Sign in')
  })

  test('GET an unregistered route when user is signed in', async () => {
    getEndemicsClaim.mockReturnValue({ organisation: {} })

    const options = {
      method: 'GET',
      url: '/random-route'
    }

    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND)

    expect($('h1').text()).toMatch('404 - Page not found')
    expect($('p:nth-child(2) > a').text().trim()).not.toContain('Sign in')
  })
})
