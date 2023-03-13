const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectLoginPage = require('../../../utils/login-page-expect')
const pageExpects = require('../../../utils/page-expects')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const mockValidEmail = 'dairy@ltd.com'
const url = '/claim/login'

describe('FarmerClaim application login page test', () => {
  beforeAll(async () => {
    jest.mock('../../../../app/lib/email/send-email')
    jest.mock('ffc-ahwr-event-publisher')
    jest.mock('../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../app/config')
      return {
        ...originalModule
      }
    })
  })

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

    test('route when already logged in redirects to select-your-business', async () => {
      const options = {
        auth: { credentials: { email: mockValidEmail }, strategy: 'cookie', isAuthenticated: true },
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(`/claim/select-your-business?businessEmail=${mockValidEmail}`)
    })
  })

  describe(`GET requests to '${url}' with select your business enabled`, () => {
    beforeAll(async () => {
      jest.resetModules()
      jest.mock('../../../../app/config', () => {
        const originalModule = jest.requireActual('../../../../app/config')
        return {
          ...originalModule
        }
      })
    })

    test('route when already logged in redirects to select-your-business', async () => {
      const options = {
        auth: { credentials: { email: mockValidEmail }, strategy: 'cookie', isAuthenticated: true },
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toContain('/claim/select-your-business')
    })
  })

  describe(`POST requests to '${url}' route`, () => {
    let sendMagicLinkEmail
    let users
    let messageApplication

    beforeAll(async () => {
      jest.resetModules()
      jest.mock('../../../../app/config', () => {
        const originalModule = jest.requireActual('../../../../app/config')
        return {
          ...originalModule
        }
      })
      jest.mock('../../../../app/lib/email/send-magic-link-email')
      sendMagicLinkEmail = require('../../../../app/lib/email/send-magic-link-email')
      users = require('../../../../app/api-requests/users')
      jest.mock('../../../../app/api-requests/users')
      jest.mock('../../../../app/messaging/application')
      messageApplication = require('../../../../app/messaging/application')
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    test.each([
      { email: 'not-an-email', errorMessage: 'Enter an email address in the correct format, like name@example.com' },
      { email: '', errorMessage: 'Enter an email address' },
      { email: null, errorMessage: 'Enter an email address' },
      { email: undefined, errorMessage: 'Enter an email address' }
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

    test('returns 200 and login sends magic link sent', async () => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        method: 'POST',
        url,
        payload: { crumb, email: mockValidEmail },
        headers: { cookie: `crumb=${crumb}` }
      }

      jest.mock('../../../../app/api-requests/users')
      users.getByEmail.mockResolvedValue({ email: mockValidEmail })
      sendMagicLinkEmail.sendFarmerClaimLoginMagicLink.mockResolvedValue(true)
      messageApplication.getClaim.mockResolvedValue({})

      const res = await global.__SERVER__.inject(options)
      expect(users.getByEmail).toBeCalledWith(mockValidEmail)
      expect(messageApplication.getClaim).not.toBeCalledTimes(1)
      expect(sendMagicLinkEmail.sendFarmerClaimLoginMagicLink).toBeCalledTimes(1)
      expect(res.statusCode).toBe(200)
    })
  })

  describe(`POST requests to '${url}' route with select your business enabled`, () => {
    let sendMagicLinkEmail
    let users
    let messageApplication

    beforeAll(async () => {
      jest.resetModules()
      jest.mock('../../../../app/config', () => {
        const originalModule = jest.requireActual('../../../../app/config')
        return {
          ...originalModule
        }
      })
      jest.mock('../../../../app/lib/email/send-magic-link-email')
      sendMagicLinkEmail = require('../../../../app/lib/email/send-magic-link-email')
      users = require('../../../../app/api-requests/users')
      jest.mock('../../../../app/api-requests/users')
      jest.mock('../../../../app/messaging/application')
      messageApplication = require('../../../../app/messaging/application')
    })

    beforeEach(async () => {
      jest.resetAllMocks()
    })

    test('returns 200 and login sends magic link sent', async () => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        method: 'POST',
        url,
        payload: { crumb, email: mockValidEmail },
        headers: { cookie: `crumb=${crumb}` }
      }

      jest.mock('../../../../app/api-requests/users')
      users.getByEmail.mockResolvedValue({ email: mockValidEmail })
      sendMagicLinkEmail.sendFarmerClaimLoginMagicLink.mockResolvedValue(true)
      messageApplication.getClaim.mockResolvedValue({})

      const res = await global.__SERVER__.inject(options)
      expect(users.getByEmail).toBeCalledWith(mockValidEmail)
      expect(messageApplication.getClaim).not.toBeCalledTimes(1)
      expect(sendMagicLinkEmail.sendFarmerClaimLoginMagicLink).toBeCalledTimes(1)
      expect(res.statusCode).toBe(200)
    })
  })
})
