const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const pageExpects = require('../../../utils/page-expects')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const { claim: { detailsCorrect } } = require('../../../../app/session/keys')
const { serviceName } = require('../../../../app/config')

const { getClaimAmount } = require('../../../../app/lib/get-claim-amount')
const { getTypeOfReviewRowForDisplay } = require('../../../../app/lib/display-helpers')

function expectPageContentOk ($, application) {
  const typeOfReviewRow = getTypeOfReviewRowForDisplay(application.data)
  expect($('.govuk-heading-l').text()).toEqual('Confirm the details of your annual health and welfare review')
  const keys = $('.govuk-summary-list__key')
  const values = $('.govuk-summary-list__value')
  expect(keys.eq(0).text()).toMatch('Business name')
  expect(values.eq(0).text()).toMatch(application.data.organisation.name)
  expect(keys.eq(1).text()).toMatch(typeOfReviewRow.key.text)
  expect(values.eq(1).text()).toMatch(typeOfReviewRow.value.text)
  expect(keys.eq(keys.length - 1).text()).toMatch('Payment amount')
  expect(values.eq(keys.length - 1).text()).toMatch(`£${getClaimAmount(application.data)}`)
  expect($('title').text()).toEqual(`Confirm the details - ${serviceName}`)
  expectPhaseBanner.ok($)
}

describe('Vet visit review page test', () => {
  let session
  const url = '/visit-review'
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }

  function setupSessionMock (speciesToTest) {
    let vvData
    const application = {
      data: {
        organisation: {
          name: 'org-name'
        },
        whichReview: speciesToTest
      },
      vetVisit: {
        data: {
          signup: {
            name: 'name of the vet'
          },
          visitDate: new Date(),
          ...vvData
        }
      }
    }
    session.getClaim.mockReturnValue(application)
    return application
  }

  describe(`GET ${url} route when logged in`, () => {
    beforeAll(async () => {
      jest.resetAllMocks()

      session = require('../../../../app/session')
      jest.mock('../../../../app/session')
    })

    test.each([
      { speciesToTest: 'beef' },
      { speciesToTest: 'dairy' },
      { speciesToTest: 'pigs' },
      { speciesToTest: 'sheep' }
    ])('returns 200 for $speciesToTest', async ({ speciesToTest }) => {
      const application = setupSessionMock(speciesToTest)
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($, application)
    })

    test('returns 404 when no farmer claim data is found', async () => {
      session.getClaim.mockReturnValue(undefined)
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(404)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
    })
  })

  describe(`POST requests to ${url} route when logged in`, () => {
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

    test('returns 400 with error message when no answer provided', async () => {
      const application = setupSessionMock('pigs')
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        auth,
        method,
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPageContentOk($, application)
      pageExpects.errors($, 'Select yes if these details are correct')
    })

    test.each([
      { answer: 'no', redirect: '/details-incorrect' },
      { answer: 'yes', redirect: '/submit-claim' }
    ])('redirects to correct page based on answer', async ({ answer, redirect }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const options = {
        auth,
        method,
        url,
        payload: { crumb, [detailsCorrect]: answer },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(redirect)
    })
  })
})
