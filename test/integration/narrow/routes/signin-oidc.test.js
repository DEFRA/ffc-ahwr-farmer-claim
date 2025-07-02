import { createServer } from '../../.././../app/server.js'
import { authConfig } from '../../../../app/config/auth.js'

describe('DefraID redirection test', () => {
  let server

  beforeAll(async () => {
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      authConfig: {
        defraId: {
          enabled: true
        },
        ruralPaymentsAgency: {
          hostname: 'rpaHostname'
        }
      }
    }))
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  const url = '/claim/signin-oidc'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe(`GET requests to '${url}'`, () => {
    test('returns 302 and redirected to dashboard', async () => {
      const code = '432432'
      const state = '83d2b160-74ce-4356-9709-3f8da7868e35'
      const baseUrl = `${url}?code=${code}&state=${state}`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(`${authConfig.defraId.dashboardRedirectUri}?code=${code}&state=${state}`)
    })
  })
})
