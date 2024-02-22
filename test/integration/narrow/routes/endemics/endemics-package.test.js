describe('Endemics package test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/endemics-package'

  describe(`GET ${url} route`, () => {
    test('Returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
    })
  })
})
