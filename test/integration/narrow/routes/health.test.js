import { createServer } from '../../../../app/server.js'

describe('Health test', () => {
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

  test('GET /healthz route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
  })
})
