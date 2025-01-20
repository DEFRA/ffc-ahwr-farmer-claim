const createServer = require('../../../../app/server')

describe('Healthz test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('GET /healthz route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
  })
})
