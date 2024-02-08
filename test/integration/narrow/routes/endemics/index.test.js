const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const mockConfig = require('../../../../../app/config')

describe('Farmer claim home page test', () => {
  beforeAll(async () => {
    jest.resetModules()
    jest.mock('../../../../../app/session')
    jest.mock('../../../../../app/config', () => ({
      ...mockConfig,
      authConfig: {
        defraId: {
          enabled: true,
          hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'b2c_1a_signupsigninsfi',
          redirectUri: 'http://localhost:3004/claim/signin-oidc',
          clientId: 'dummy_client_id',
          serviceId: 'dummy_service_id',
          scope: 'openid dummy_client_id offline_access'
        },
        ruralPaymentsAgency: {
          hostname: 'rpaHostname'
        }
      },
      endemics: {
        enabled: true
      }
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('GET /claim route returns 200 when not logged in', async () => {
    const options = {
      method: 'GET',
      url: '/claim/endemics'
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toEqual(
      'Claim for funding for livestock health and welfare reviews and endemic disease follow-ups'
    )

    const button = $('.govuk-main-wrapper .govuk-button')
    expect(button.attr('href')).toContain(
      'https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'
    )
    expect(button.text()).toMatch('Start now')
    expect($('title').text()).toEqual(
      'Claim funding - Annual health and welfare review of livestock'
    )
    expectPhaseBanner.ok($)
  })

  jest.mock('../../../../../app/api-requests/application-service-api', () => ({
    getLatestApplicationsBySbi: jest.fn().mockResolvedValue([
      {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 10,
        type: 'EE'
      }
    ])
  }))
  jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
    getClaimsByApplicationReference: jest.fn().mockResolvedValue([
      {
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'R',
        createdAt: '2023-12-19T10:25:11.318Z'
      }
    ]),
    isWithInLastTenMonths: jest.fn().mockResolvedValue(true)
  }))
  test('Redirect to You Cannot Claim page if latest application is within last 10 months and rejected', async () => {
    const options = {
      method: 'GET',
      url: '/claim/endemics?from=dashboard&sbi=112670111'
    }

    await global.__SERVER__.inject(options)
  })
  jest.clearAllMocks()

  jest.mock(
    '../../../../../app/api-requests/application-service-api',
    () => ({
      getLatestApplicationsBySbi: jest.fn().mockResolvedValue([
        {
          reference: 'AHWR-2470-6BA9',
          createdAt: Date.now(),
          statusId: 1,
          type: 'EE'
        }
      ])
    })
  )
  jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
    getClaimsByApplicationReference: jest.fn().mockResolvedValue([
      {
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 10,
        type: 'E',
        createdAt: '2023-12-19T10:25:11.318Z'
      }
    ]),
    isWithInLastTenMonths: jest.fn().mockResolvedValue(true)
  }))
  test('Redirect to You Cannot Claim page if latest application is within last 10 months and rejected', async () => {
    const options = {
      method: 'GET',
      url: '/claim/endemics?from=dashboard&sbi=112670111'
    }

    await global.__SERVER__.inject(options)
  })
  jest.clearAllMocks()
  jest.mock(
    '../../../../../app/api-requests/application-service-api',
    () => ({
      getLatestApplicationsBySbi: jest.fn().mockResolvedValue([
        {
          reference: 'AHWR-2470-6BA9',
          createdAt: Date.now(),
          statusId: 1,
          type: 'EE'
        }
      ])
    })
  )
  jest.mock('../../../../../app/api-requests/claim-service-api', () => ({
    getClaimsByApplicationReference: jest.fn().mockResolvedValue([
      {
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'E',
        createdAt: '2023-12-19T10:25:11.318Z'
      }
    ]),
    isWithInLastTenMonths: jest.fn().mockResolvedValue(true)
  }))
  test('Redirect to You Cannot Claim page if latest application is within last 10 months and rejected', async () => {
    const options = {
      method: 'GET',
      url: '/claim/endemics?from=dashboard&sbi=112670111'
    }

    await global.__SERVER__.inject(options)
  })
  jest.clearAllMocks()
})
