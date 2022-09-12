const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { name: nameErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { vetName: nameKey } } = require('../../../../app/session/keys')
const { serviceName } = require('../../../../app/config')

function expectPageContentOk ($) {
  expect($('.govuk-heading-l').text()).toEqual('What is the name of the vet who did the review?')
  expect($('label[for=name]').text()).toMatch('Vet\'s full name')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toEqual(`What is the name of the vet who did the review? - ${serviceName}`)
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/vet-rcvs')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Vet, enter name test', () => {
  const url = '/vet-name'

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

    test('loads name if in session', async () => {
      const name = 'vet name'
      const options = {
        method: 'GET',
        url
      }
      session.getClaim.mockReturnValue(name)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#name').val()).toEqual(name)
    })
  })

  describe(`POST to ${url} route`, () => {
    test.each([
      { name: undefined, errorMessage: nameErrorMessages.enterName, expectedVal: undefined },
      { name: null, errorMessage: nameErrorMessages.enterName, expectedVal: undefined },
      { name: '', errorMessage: nameErrorMessages.enterName, expectedVal: undefined },
      { name: 'a'.repeat(101), errorMessage: nameErrorMessages.nameLength, expectedVal: 'a'.repeat(101) }
    ])('returns 400 when payload is invalid - %p', async ({ name, errorMessage, expectedVal }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method: 'POST',
        payload: { crumb, name },
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#name').val()).toEqual(expectedVal)
    })

    test.each([
      { name: 'a' },
      { name: 'a'.repeat(100) },
      { name: `  ${'a'.repeat(100)}  ` }
    ])('returns 200 when payload is valid and stores in session (name = $name)', async ({ name }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method: 'POST',
        payload: { crumb, name },
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/vet-practice')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, nameKey, name.trim())
    })
  })
})
