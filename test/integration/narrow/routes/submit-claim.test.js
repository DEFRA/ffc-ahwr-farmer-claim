const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const getCrumbs = require('../../../utils/get-crumbs')
const states = require('../../../../app/constants/states')
const appInsights = require('applicationinsights')

const sessionMock = require('../../../../app/session')
jest.mock('../../../../app/session')
const messagingMock = require('../../../../app/messaging')
jest.mock('../../../../app/messaging')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../app/lib/logout')
const reference = 'VV-1234-5678'
const data = {
  offerStatus: 'accepted'
}

describe('Farmer claim - submit claim page test', () => {
  const url = '/claim/submit-claim'
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }

  beforeEach(() => {
    sessionMock.getClaim.mockReturnValue({
      reference,
      data,
      visitDate: '2022-11-07T00:00:00.000Z',
      dateOfClaim: '2022-11-08T00:00:00.000Z',
      vetName: 'testvetname',
      vetRcvs: '1234234',
      detailsCorrect: 'yes',
      urnResult: '134242'
    })
  })

  afterEach(() => {
    sessionMock.getClaim.mockRestore()
  })

  describe(`GET ${url} route when logged in`, () => {
    test('returns 200', async () => {
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('Submit your claim')
      expectPhaseBanner.ok($)
    })

    test.each([
      { liContent: 'the vet tested the required number of animals' }
    ])('return 200 including $liContent', async ({ liContent }) => {
      const options = {
        auth,
        method: 'GET',
        url
      }

      sessionMock.getClaim.mockReturnValue(34)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-list').text()).toContain(liContent)
    })

    test('return 200 no including the vet tested the required number of animals', async () => {
      const options = {
        auth,
        method: 'GET',
        url
      }

      sessionMock.getClaim.mockReturnValue(undefined)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-list').text()).not.toContain('the vet tested the required number of animals')
    })
  })

  describe(`POST requests to ${url} route`, () => {
    const method = 'POST'

    function expectAppInsightsEventRaised (reference, status) {
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
        name: 'claim-submitted',
        properties: {
          reference,
          state: status,
          scheme: 'old-world'
        }
      })
    }

    test.each([
      { crumb: '' },
      { crumb: undefined }
    ])('returns 403 when request does not contain crumb - $crumb', async ({ crumb }) => {
      const options = {
        auth,
        method,
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

    test.each([
      { heading: 'Claim complete', state: states.success },
      { heading: 'Funding claim failed', state: states.failed }
    ])('returns 403 when duplicate submission - $crumb', async ({ heading, state }) => {
      messagingMock.receiveMessage.mockResolvedValueOnce({ state })
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        auth,
        method,
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res1 = await global.__SERVER__.inject(options)
      expect(res1.statusCode).toBe(200)
      expect(cheerio.load(res1.payload)('h1').text()).toMatch(heading)

      const res2 = await global.__SERVER__.inject(options)
      expect(res2.statusCode).toBe(403)
      const $ = cheerio.load(res2.payload)
      expectPhaseBanner.ok($)
      expect($('.govuk-heading-l').text()).toEqual('403 - Forbidden')
    })

    test.each([
      { heading: 'Claim complete', state: states.success },
      { heading: 'Funding claim failed', state: states.failed },
      { heading: 'Funding already claimed', state: states.alreadyClaimed },
      { heading: 'Funding claim not found', state: states.notFound }
    ])('returns page for $heading when claim submission returns $state state. Appropriate submit claim event raised', async ({ heading, state }) => {
      messagingMock.receiveMessage.mockResolvedValueOnce({ state })
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        auth,
        method,
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      expect($('h1').text()).toMatch(heading)
      expect($('body').text()).toContain(reference)

      expectAppInsightsEventRaised('VV-1234-5678', state)
    })
  })
})
