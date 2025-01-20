const createServer = require('../../../../app/server')

describe('Healthy test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET /healthy route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthy'
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
  })
})
