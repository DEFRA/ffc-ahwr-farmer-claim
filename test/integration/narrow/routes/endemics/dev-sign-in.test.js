import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/routes/models/latest-application')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    config: {
      ...originalModule.config,
      devLogin: {
        enabled: true
      }
    }
  }
})

const url = '/claim/endemics/dev-sign-in'

describe(`${url} route page`, () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('GET dev-login', () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('SBI to use?')
      expect($('title').text().trim()).toContain('What is your SBI? - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
    })
  })

  describe(`POST requests to '${url}'`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('returns 302 and redirected to dashboard sign in handler', async () => {
      const baseUrl = `${url}`
      const options = {
        method: 'POST',
        url: baseUrl,
        payload: {
          crumb,
          sbi: '12345678'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toMatch('dev-sign-in?sbi=12345678&cameFrom=claim')
    })
  })
})
