const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const sessionMock = require('../../../../app/session')
const { serviceName } = require('../../../../app/config')
jest.mock('../../../../app/session')

describe('Check Answers test', () => {
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }
  const url = '/claim/check-answers'

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
      expect($('title').text()).toEqual(`Check your answers - ${serviceName}`)
      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to /login', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })
  })
})
