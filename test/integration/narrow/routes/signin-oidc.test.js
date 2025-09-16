import { createServer } from '../../.././../app/server.js'
import HttpStatus from 'http-status-codes'
import * as cheerio from 'cheerio'
import { config } from '../../../../app/config/index.js'

describe('DefraID redirection test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  const url = '/claim/signin-oidc'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe(`GET requests to '${url}'`, () => {
    test('returns 302 and redirected to dashboard', async () => {
      const code = '432432'
      const state = '83d2b160-74ce-4356-9709-3f8da7868e35'
      const baseUrl = `${url}?code=${code}&state=${state}`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.MOVED_TEMPORARILY)
      expect(res.headers.location).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test('returns 302 and redirected to login failed page when an error is thrown', async () => {
      const code = '432432'
      const state = '83d2b160-74ce-4356-9709-3f8da7868e35'
      const baseUrl = `${url}?code=${code}&state=${state}`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      global.URLSearchParams = function () {
        throw new Error('forced test error')
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)

      const $ = cheerio.load(res.payload)
      expect($('h1.govuk-heading-l').text()).toEqual('Login failed')
      expect($('title').text()).toContain('Login failed')
    })
  })
})
