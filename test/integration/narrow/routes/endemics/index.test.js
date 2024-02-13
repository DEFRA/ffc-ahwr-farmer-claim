const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const urlPrefix = require('../../../../../app/config').urlPrefix
const applicationServiceApiMock = require('../../../../../app/api-requests/application-service-api')
const claimServiceApiMock = require('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/api-requests/application-service-api')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('Claim endemics home page test', () => {
  const url = `${urlPrefix}/endemics?from=dashboard&sbi=1234567`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeAll(() => {
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
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: true
        }
      }
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    crumb = await getCrumbs(global.__SERVER__)
  })

  test('Redirects us to endemicsYouCannotClaimURI if latest VV application is within 10 months and status is rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 10,
        type: 'VV'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/you-cannot-claim')
  })

  test('Redirects us to endemicsYouCannotClaimURI if latest claim is within 10 months and status is rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 10,
        type: 'E'
      }
    ])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/you-cannot-claim')
  })

  test('Redirects us to endemicsWhichTypeOfReviewURI if latest claim is within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'R'
      }
    ])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
  })

  test('Redirects us to endemicsWhichTypeOfReviewURI if latest application is within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(true)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
  })

  test('Redirects us to endemicsWhichReviewAnnualURI if latest application is NOT within 10 months and status is NOT rejected', async () => {
    applicationServiceApiMock.getLatestApplicationsBySbi.mockReturnValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    ])
    claimServiceApiMock.getClaimsByApplicationReference.mockReturnValue([])
    claimServiceApiMock.isWithInLastTenMonths.mockReturnValue(false)

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-review-annual')
  })

  test('Renders index page if no url parameters', async () => {
    const options = {
      method: 'GET',
      url: `${urlPrefix}/endemics`,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text().trim()).toMatch('Claim for funding for livestock health and welfare reviews and endemic disease follow-ups')
    expect($('title').text().trim()).toEqual('Claim funding - Annual health and welfare review of livestock')
    expectPhaseBanner.ok($)
    
  })
})
