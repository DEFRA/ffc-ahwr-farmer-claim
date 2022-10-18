const { urlPrefix } = require('../../../../app/config')

describe('headers plugin tests', () => {
  test.each([
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
      value: "default-src 'self';object-src 'none';script-src  'unsafe-hashes' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com/ https://www.google-analytics.com https://www.googletagmanager.com/gtm.jsform-action 'self';base-uri 'self';connect-src 'self' https://www.google-analytics.com;style-src 'self' 'unsafe-inline' https://tagmanager.google.com https://fonts.googleapis.com;img-src 'self' data: ssl.gstatic.com www.gstatic.com www.google-analytics.com"
    }
  ])('returns IT healcheck', async ({ key, value }) => {
    const url = `${urlPrefix}/start`
    const options = {
      method: 'GET',
      url
    }
    const res = await global.__SERVER__.inject(options)
    expect(res.headers[key.toLowerCase()]).toEqual(value)
  })
})
