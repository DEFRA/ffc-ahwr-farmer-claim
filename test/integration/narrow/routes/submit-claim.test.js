const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const getCrumbs = require('../../../utils/get-crumbs')
const states = require('../../../../app/constants/states')

const sessionMock = require('../../../../app/session')
jest.mock('../../../../app/session')
const messagingMock = require('../../../../app/messaging')
jest.mock('../../../../app/messaging')

const reference = 'VV-1234-5678'
const data = {
  offerStatus: 'accepted'
}

sessionMock.getClaim.mockReturnValue({ reference, data, visitDate: '2022-11-07T00:00:00.000Z', dateOfClaim: '2022-11-08T00:00:00.000Z', vetName: 'testvetname', vetRcvs: '1234234', detailsCorrect: 'yes', urnResult: '134242' })

describe('Farmer claim - submit claim page test', () => {
  const url = '/claim/submit-claim'
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }

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
  })

  describe(`POST requests to ${url} route`, () => {
    const method = 'POST'

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
    ])('returns page for $heading when claim submission returns $state state', async ({ heading, state }) => {
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
    })
  })
})
