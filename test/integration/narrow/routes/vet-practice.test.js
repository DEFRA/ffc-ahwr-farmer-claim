const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const pageExpects = require('../../../utils/page-expects')
const { practice: practiceErrorMessages } = require('../../../../app/lib/error-messages')
const { farmerApplyData: { vetPractice: practiceKey } } = require('../../../../app/session/keys')
const { serviceName } = require('../../../../app/config')

function expectPageContentOk ($) {
  expect($('h1').text()).toMatch('What is the vet practice name?')
  expect($('label[for=practice]').text()).toMatch('What is the vet practice name?')
  expect($('.govuk-button').text()).toMatch('Continue')
  expect($('title').text()).toEqual(`What is the vet practice name? - ${serviceName}`)
  const backLink = $('.govuk-back-link')
  expect(backLink.text()).toMatch('Back')
  expect(backLink.attr('href')).toMatch('/vet-name')
}

const session = require('../../../../app/session')
jest.mock('../../../../app/session')

describe('Vet, enter practice name test', () => {
  const url = '/vet-practice'
  const auth = { credentials: {}, strategy: 'cookie' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 302 and redirects to /login when not logged in', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })

    test('returns 200 when logged in', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
    })

    test('loads practice name if in session', async () => {
      const practiceName = 'practice name'
      const options = {
        method: 'GET',
        url,
        auth
      }
      session.getClaim.mockReturnValue(practiceName)

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      expect($('#practice').val()).toEqual(practiceName)
    })
  })

  describe(`POST to ${url} route`, () => {
    const method = 'POST'
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('when not logged in redirects to /login', async () => {
      const options = {
        method,
        url,
        payload: { crumb, practice: 'vetpracticename' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/login')
    })

    test.each([
      { practice: undefined, errorMessage: practiceErrorMessages.enterName, expectedVal: undefined },
      { practice: null, errorMessage: practiceErrorMessages.enterName, expectedVal: undefined },
      { practice: '', errorMessage: practiceErrorMessages.enterName, expectedVal: undefined },
      { practice: 'a'.repeat(101), errorMessage: practiceErrorMessages.nameLength, expectedVal: 'a'.repeat(101) }
    ])('returns 400 when payload is invalid - %p', async ({ practice, errorMessage, expectedVal }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, practice },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($)
      expectPhaseBanner.ok($)
      pageExpects.errors($, errorMessage)
      expect($('#practice').val()).toEqual(expectedVal)
    })

    test.each([
      { practice: 'a' },
      { practice: 'a'.repeat(100) },
      { practice: `  ${'a'.repeat(100)}  ` }
    ])('returns 200 when payload is valid and stores in session (practice = $practice)', async ({ practice }) => {
      const options = {
        headers: { cookie: `crumb=${crumb}` },
        method,
        payload: { crumb, practice },
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/submit-claim')
      expect(session.setClaim).toHaveBeenCalledTimes(1)
      expect(session.setClaim).toHaveBeenCalledWith(res.request, practiceKey, practice.trim())
    })
  })
})
