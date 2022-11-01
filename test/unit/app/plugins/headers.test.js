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
      value: "default-src 'self';object-src 'none';script-src 'self' www.google-analytics.com *.googletagmanager.com ajax.googleapis.com *.googletagmanager.com/gtm.js 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes';form-action 'self';base-uri 'self';connect-src *.google-analytics.com *.analytics.google.com *.googletagmanager.comstyle-src 'self' 'unsafe-inline' tagmanager.google.com *.googleapis.com;img-src 'self' *.google-analytics.com *.googletagmanager.com;"
    }
  ])('returns IT healcheck', async ({ key, value }) => {
    const url = '/claim'
    const options = {
      method: 'GET',
      url
    }
    const res = await global.__SERVER__.inject(options)
    expect(res.headers[key.toLowerCase()]).toEqual(value)
  })
})
