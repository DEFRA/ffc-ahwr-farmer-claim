const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { rcvs: rcvsErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { vetRcvs: rcvsKey } } = require('../../../../app/session/keys')
const { serviceName } = require('../../../../app/config')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('What is the vet\'s Royal College of Veterinary Surgeons (RCVS) number?')
  expect($('label[for=rcvs]').text()).toMatch('RCVS number')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toEqual(`What is the vet's Royal College of Veterinary Surgeons (RCVS) number? - ${serviceName}`)
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/visit-review')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Vet, enter rcvs test', () => {
  const url = '/vet-rcvs'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200 when not logged in', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
    })

    test('loads rcvs number if in session', async () => {
      const rcvs = '1234567'
      const options = {
        method: 'GET',
        url
      }
      session.getClaim.mockReturnValue(rcvs)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#rcvs').val()).toEqual(rcvs)
    })
  })

  describe(`POST to ${url} route`, () => {
    test.each([
      { rcvs: undefined, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: null, errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: '', errorMessage: rcvsErrorMessages.enterRCVS, expectedVal: undefined },
      { rcvs: 'not-valid-ref', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: 'not-valid-ref' },
      { rcvs: '123456A', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '123456A' },
      { rcvs: '12345678', errorMessage: rcvsErrorMessages.validRCVS, expectedVal: '12345678' }
    ])('returns 400 when payload is invalid - %p', async ({ rcvs, errorMessage, expectedVal }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method: 'POST',
        payload: { crumb, rcvs },
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#rcvs').val()).toEqual(expectedVal)
    })

    test.each([
      { rcvs: '1234567' },
      { rcvs: '123456X' },
      { rcvs: '  123456X  ' }
    ])('returns 200 when payload is valid and stores in session (rcvs = $rcvs)', async ({ rcvs }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method: 'POST',
        payload: { crumb, rcvs },
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/vet-name')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, rcvsKey, rcvs.trim())
    })
  })
})
