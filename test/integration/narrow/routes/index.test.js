const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const mockConfig = require('../../../../app/config')

describe('Farmer claim home page test - DEFRA ID disabled', () => {
  beforeAll(async () => {
    jest.resetModules()
    jest.mock('../../../../app/session')
    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      authConfig: {
        defraId: {
          enabled: false
        }
      }
    }))
  })

  test('GET /claim route returns 200 when not logged in', async () => {
    const options = {
      method: 'GET',
      url: '/claim'
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toEqual(
      'Claim funding for an annual health and welfare review of your livestock'
    )
    const button = $('.govuk-main-wrapper .govuk-button')
    expect(button.attr('href')).toMatch('/')
    expect(button.text()).toMatch('Start now')
    expect($('title').text()).toEqual('Claim funding - Annual health and welfare review of livestock')
    expectPhaseBanner.ok($)
  })
})

describe('Farmer claim home page test - DEFRA ID enabled', () => {
  beforeAll(async () => {
    jest.resetModules()
    jest.mock('../../../../app/session')
    jest.mock('../../../../app/config', () => ({
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
      }
    }))
  })

  test('GET /claim route returns 200 when not logged in', async () => {
    const options = {
      method: 'GET',
      url: '/claim'
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toEqual(
      'Claim for an annual health and welfare review of your livestock'
    )
    const button = $('.govuk-main-wrapper .govuk-button')
    expect(button.attr('href')).toContain('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize')
    expect(button.text()).toMatch('Start now')
    expect($('title').text()).toEqual('Claim funding - Annual health and welfare review of livestock')
    expectPhaseBanner.ok($)
  })
})
