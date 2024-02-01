describe('Ineligibility test', () => {
  const url = '/claim/endemics/ineligible'
  const auth = { credentials: {}, strategy: 'cookie' }

  test('returns 200', async () => {
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(200)
  })
})
