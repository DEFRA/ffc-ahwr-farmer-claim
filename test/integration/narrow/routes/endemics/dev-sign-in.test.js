import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { getLatestApplicationForSbi } from '../../../../../app/routes/models/latest-application.js'
import { setAuthCookie } from '../../../../../app/auth/cookie-auth/cookie-auth.js'
import { setEndemicsClaim } from '../../../../../app/session/index.js'
import { NoApplicationFoundError } from '../../../../../app/exceptions/no-application-found.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/routes/models/latest-application')
jest.mock('../../../../../app/auth/cookie-auth/cookie-auth')
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

    test('returns 302 and redirected to endemics start view when authenticate successful', async () => {
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

      getLatestApplicationForSbi.mockResolvedValueOnce(
        {
          claimed: false,
          createdAt: '2023-01-17 14:55:20',
          createdBy: 'David Jones',
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            eligibleSpecies: 'yes',
            offerStatus: 'accepted',
            organisation: {
              address: '1 Example Road',
              crn: 1111111111,
              email: 'business@email.com',
              farmerName: 'Mr Farmer',
              name: 'My Amazing Farm',
              sbi: 12345678
            },
            reference: 'string'
          },
          id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
          reference: 'IAHW-5C1C-AAAA',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      )

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics?from=dashboard&sbi=12345678')
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(setAuthCookie).toBeCalledTimes(1)
      expect(setEndemicsClaim).toBeCalledTimes(1)
    })

    test('redirects to exception page if getLatestApplicationForSbi throws a NoApplicationFoundError', async () => {
      const sbi = '12345678'
      const baseUrl = `${url}`
      const options = {
        method: 'POST',
        url: baseUrl,
        payload: {
          crumb,
          sbi
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getLatestApplicationForSbi.mockImplementation(() => {
        throw new NoApplicationFoundError(
          `No application found for SBI - ${sbi}`,
          {
            sbi,
            name: ''
          }
        )
      })

      const res = await server.inject(options)

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h1').text().trim()).toMatch(`You cannot sign in with SBI ${sbi}`)
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(setAuthCookie).toBeCalledTimes(0)
      expect(setEndemicsClaim).toBeCalledTimes(0)
    })
  })
})
