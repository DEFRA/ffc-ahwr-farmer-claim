const Hapi = require('@hapi/hapi')
const plugin = require('../../../../app/plugins/redirect-claim-ref-missing')
const { getEndemicsClaim } = require('../../../../app/session')
const { claimDashboard } = require('../../../../app/config/routes')

jest.mock('../../../../app/session')

describe('redirect-reference-missing plugin', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server()
    await server.register(plugin)
    server.route({
      method: 'GET',
      path: '/claim/endemics/which-species',
      handler: (_, h) => h.response('ok').code(200)
    })
    server.route({
      method: 'GET',
      path: '/claim/endemics',
      handler: (_, h) => h.response('ok').code(200)
    })
    server.route({
      method: 'POST',
      path: '/claim/endemics/which-species',
      handler: (_, h) => h.response('ok').code(200)
    })
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should redirect if claim reference is missing for endemic child routes', async () => {
    getEndemicsClaim.mockReturnValueOnce({})

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics/which-species'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(claimDashboard)
  })

  test('should allow request to continue if claim reference exists', async () => {
    getEndemicsClaim.mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics/which-species'
    })

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe('ok')
  })

  test('should allow request to continue for non endemics child routes', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics'
    })

    expect(response.statusCode).toBe(200)
  })

  test('should allow request to continue for methods that are not GET', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/claim/endemics/which-species'
    })

    expect(response.statusCode).toBe(200)
  })
})
