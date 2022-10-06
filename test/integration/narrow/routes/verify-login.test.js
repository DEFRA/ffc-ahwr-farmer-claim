describe('verify-login route', () => {
  beforeAll(async () => {
    jest.resetAllMocks()
    jest.mock('ffc-ahwr-event-publisher')
  })

  test('GET /verify-login returns 400', async () => {
    const options = {
      method: 'GET',
      url: '/verify-login?email=test@test.com'
    }

    const result = await global.__SERVER__.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('GET /verify-login returns 400', async () => {
    const options = {
      method: 'GET',
      url: '/verify-login?email=test@test.com&token=0c8f9708-453b-11ed-b878-0242ac120002'
    }

    const result = await global.__SERVER__.inject(options)
    expect(result.statusCode).toBe(400)
  })
})
