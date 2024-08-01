const cheerio = require('cheerio')
const { getEndemicsClaim } = require('../../../../../app/session')
const { endemicsConfirmation } = require('../../../../../app/config/routes')
const { getReviewType } = require('../../../../../app/lib/get-review-type')
jest.mock('../../../../../app/session')

describe('Claim confirmation', () => {
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
    return {
      ...originalModule,
      authConfig: {
        defraId: {
          hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'b2c_1a_signupsigninsfi',
          redirectUri: 'http://localhost:3000/apply/signin-oidc',
          clientId: 'dummy_client_id',
          serviceId: 'dummy_service_id',
          scope: 'openid dummy_client_id offline_access'
        },
        ruralPaymentsAgency: {
          hostname: 'dummy-host-name',
          getPersonSummaryUrl: 'dummy-get-person-summary-url',
          getOrganisationPermissionsUrl:
            'dummy-get-organisation-permissions-url',
          getOrganisationUrl: 'dummy-get-organisation-url'
        }
      },
      endemics: {
        enabled: true
      }
    }
  })
  const reference = 'TBD-F021-723B'
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = `/claim/${endemicsConfirmation}`

  test.each([
    { typeOfLivestock: 'beef', typeOfReview: 'E' },
    { typeOfLivestock: 'pigs', typeOfReview: 'E' },
    { typeOfLivestock: 'dairy', typeOfReview: 'E' },
    { typeOfLivestock: 'sheep', typeOfReview: 'E' },
    { typeOfLivestock: 'beef', typeOfReview: 'R' },
    { typeOfLivestock: 'pigs', typeOfReview: 'R' },
    { typeOfLivestock: 'dairy', typeOfReview: 'R' },
    { typeOfLivestock: 'sheep', typeOfReview: 'R' }
  ])('GET endemicsConfirmation route', async ({ typeOfReview }) => {
    const { isReview } = getReviewType(typeOfReview)
    const options = {
      method: 'GET',
      url,
      auth
    }

    getEndemicsClaim.mockImplementation(() => {
      return {
        reference,
        amount: 55,
        typeOfReview
      }
    })
    const res = await global.__SERVER__.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#amount').text()).toContain('55')
    expect($('#reference').text().trim()).toEqual(reference)
    expect($('#message').text().trim()).toContain(isReview ? 'animal health and welfare review' : 'endemic disease follow-up')
  })
})
