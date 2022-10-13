const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectLoginPage = require('../../../utils/login-page-expect')
const pageExpects = require('../../../utils/page-expects')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')

describe('FarmerClaim application login page test', () => {
  beforeAll(async () => {
    jest.resetAllMocks()
    jest.mock('../../../../app/lib/email/send-email')
    jest.mock('../../../../app/api-requests/users')
    jest.mock('ffc-ahwr-event-publisher')
  })

  const url = '/claim/login'
  const validEmail = 'dairy@ltd.com'

  describe(`GET requests to '${url}'`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      expectLoginPage.hasCorrectContent($, 'apply')
    })

    test('route when already logged in redirects to visit-review', async () => {
      const options = {
        auth: { credentials: { email: validEmail }, strategy: 'cookie', isAuthenticated: true },
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/visit-review')
    })
  })

  describe(`POST requests to '${url}' route`, () => {
    test.each([
      { email: 'not-an-email', errorMessage: 'Enter an email address in the correct format, like name@example.com' },
      { email: '', errorMessage: 'Enter an email address' },
      { email: null, errorMessage: 'Enter an email address' },
      { email: undefined, errorMessage: 'Enter an email address' },
      { email: 'missing@email.com', errorMessage: 'No user found with email address "missing@email.com"' }
    ])('returns 400 when request contains incorrect email - %p', async ({ email, errorMessage }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        method: 'POST',
        url,
        payload: { crumb, email },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      expectLoginPage.hasCorrectContent($, 'apply')
      pageExpects.errors($, errorMessage)
    })

    test.each([
      { crumb: '' },
      { crumb: undefined }
    ])('returns 403 when request does not contain crumb - $crumb', async ({ crumb }) => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(403)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      expect($('.govuk-heading-l').text()).toEqual('403 - Forbidden')
    })
  })
})
