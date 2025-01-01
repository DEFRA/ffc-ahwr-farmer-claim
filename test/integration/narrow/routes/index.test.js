const mockConfig = require('../../../../app/config')
jest.mock('../../../../app/lib/logout')

describe('Farmer claim home page test', () => {
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
      },
      endemics: {
        enabled: false
      }
    }))
  })

  test('GET /claim route returns 302 when not logged in', async () => {
    const options = {
      method: 'GET',
      url: '/claim'
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics')
  })

  test('headers are being set appropriately', async () => {
    const expectedHeaders = [
      { key: 'X-Frame-Options', value: 'deny' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000;' },
      { key: 'Cache-Control', value: 'no-cache' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self';object-src 'none';script-src 'self' www.google-analytics.com *.googletagmanager.com ajax.googleapis.com *.googletagmanager.com/gtm.js 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes';form-action 'self';base-uri 'self';connect-src 'self' *.google-analytics.com *.analytics.google.com *.googletagmanager.comstyle-src 'self' 'unsafe-inline' tagmanager.google.com *.googleapis.com;img-src 'self' *.google-analytics.com *.googletagmanager.com;"
      },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' }
    ]

    const options = {
      method: 'GET',
      url: '/claim'
    }

    const res = await global.__SERVER__.inject(options)

    expectedHeaders.forEach((header) => {
      expect(res.headers[header.key.toLowerCase()]).toEqual(header.value)
    })
  })
})
