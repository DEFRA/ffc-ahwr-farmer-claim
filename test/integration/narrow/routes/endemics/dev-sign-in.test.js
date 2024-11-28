const cheerio = require('cheerio')
const sessionMock = require('../../../../../app/session')
jest.mock('../../../../../app/session')
const latestApplicationMock = require('../../../../../app/routes/models/latest-application')
jest.mock('../../../../../app/routes/models/latest-application')
const authMock = require('../../../../../app/auth')
jest.mock('../../../../../app/auth')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getCrumbs = require('../../../../utils/get-crumbs')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const url = '/claim/endemics/dev-sign-in'

describe(`${url} route page`, () => {
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
    return {
      ...originalModule,
      isDev: true
    }
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

      const res = await global.__SERVER__.inject(options)

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
      crumb = await getCrumbs(global.__SERVER__)
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

      latestApplicationMock.mockResolvedValueOnce(
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

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics?from=dashboard&sbi=12345678')
      expect(latestApplicationMock).toBeCalledTimes(1)
      expect(authMock.setAuthCookie).toBeCalledTimes(1)
      expect(sessionMock.setEndemicsClaim).toBeCalledTimes(1)
    })
  })
})
