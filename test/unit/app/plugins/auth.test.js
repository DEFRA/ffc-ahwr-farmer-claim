import { config } from '../../../../app/config/index.js'
import { createServer } from '../../../../app/server.js'

describe('Auth plugin test', () => {
  let server

  beforeAll(async () => {
    jest.resetAllMocks()
    jest.mock('../../../../app/session')

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET requests to defra id', () => {
    const url = '/claim/endemics/date-of-visit'

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })
  })
})
