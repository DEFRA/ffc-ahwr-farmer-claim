const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const sessionMock = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Check Answers test', () => {
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }
  const url = '/claim/check-answers'

  beforeAll(() => {
    jest.mock('../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../app/config')
      return {
        ...originalModule,
        authConfig: {
          defraId: {
            enabled: false
          }
        }
      }
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const organisation = {
        name: 'org-name',
        sbi: '1324243'
      }
      const claim = {
        data: {
          whichReview: 'beef'
        }
      }
      sessionMock.getClaim.mockReturnValueOnce('XYZ')
        .mockReturnValueOnce('2015-03-25')
        .mockReturnValueOnce('1234567')
        .mockReturnValueOnce('URNREF')
        .mockReturnValueOnce(organisation)
        .mockReturnValueOnce(claim)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toEqual('Check your answers - Annual health and welfare review of livestock')
      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to /login', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/login')
    })
  })
})
