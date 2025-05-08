import cheerio from 'cheerio'
import links from '../../../../../app/config/routes.js'
import { createServer } from '../../../../../app/server.js'
import { getReviewType } from '../../../../../app/lib/get-review-type.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'

const { endemicsConfirmation } = links
jest.mock('../../../../../app/session')

describe('Claim confirmation', () => {
  let server

  beforeAll(async () => {
    jest.mock('../../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../../app/config')
      return {
        ...originalModule,
        authConfig: {
          defraId: {
            hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
            oAuthAuthorisePath: '/oauth2/v2.0/authorize',
            policy: 'b2c_1a_signupsigninsfi',
            dashboardRedirectUri: 'http://localhost:3003/signin-oidc',
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
        }
      }
    })
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
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
    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#amount').text()).toContain('55')
    expect($('#reference').text().trim()).toEqual(reference)
    expect($('#message').text().trim()).toContain(isReview ? 'animal health and welfare review' : 'endemic disease follow-up')
  })
})
