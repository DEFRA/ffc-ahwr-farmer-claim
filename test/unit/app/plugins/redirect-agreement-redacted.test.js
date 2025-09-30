import Hapi from '@hapi/hapi'
import { redirectAgreementRedactedPlugin } from '../../../../app/plugins/redirect-agreement-redacted.js'
import links from '../../../../app/config/routes.js'
import { getEndemicsClaim } from '../../../../app/session/index.js'

const { claimDashboard } = links

jest.mock('../../../../app/session')

describe('redirect-agreement-redacted plugin', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server()
    await server.register(redirectAgreementRedactedPlugin)
    server.route({
      method: 'GET',
      path: '/claim/endemics/which-type-of-review',
      handler: (_, h) => h.response('ok').code(200)
    })
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

  beforeEach(async () => {
    jest.resetAllMocks()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should redirect if agreement is redacted for endemic child routes', async () => {
    getEndemicsClaim.mockReturnValueOnce({
      latestEndemicsApplication: {
        applicationRedacts: [{
          success: 'Y'
        }]
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics/which-type-of-review'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(claimDashboard)
  })

  test('should not redirect when agreement is redacted and route is which-species', async () => {
    getEndemicsClaim.mockReturnValueOnce({
      latestEndemicsApplication: {
        applicationRedacts: [{
          success: 'Y'
        }]
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics/which-species'
    })

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe('ok')
  })

  test('should allow request to continue if agreement is not redacted', async () => {
    getEndemicsClaim.mockReturnValueOnce({
      latestEndemicsApplication: {
        applicationRedacts: []
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics/which-type-of-review'
    })

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe('ok')
  })

  test('should allow request to continue for non endemics child routes', async () => {
    getEndemicsClaim.mockReturnValueOnce({
      latestEndemicsApplication: {
        applicationRedacts: [{
          success: 'Y'
        }]
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/claim/endemics'
    })

    expect(response.statusCode).toBe(200)
  })

  test('should allow request to continue for methods that are not GET', async () => {
    getEndemicsClaim.mockReturnValueOnce({
      latestEndemicsApplication: {
        applicationRedacts: [{
          success: 'Y'
        }]
      }
    })

    const response = await server.inject({
      method: 'POST',
      url: '/claim/endemics/which-species'
    })

    expect(response.statusCode).toBe(200)
  })
})
