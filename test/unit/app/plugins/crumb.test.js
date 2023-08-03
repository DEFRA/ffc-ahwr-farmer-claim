const Hapi = require('@hapi/hapi')
const crumbPlugin = require('../../../../app/plugins/crumb')
const config = require('../../../../app/config')

jest.mock('../../../../app/config', () => ({
  ...jest.requireActual('../../../../app/config'),
  urlPrefix: '/claim'
}))

describe('Crumb Plugin', () => {
  test('is correctly configured', () => {
    expect(crumbPlugin.options.cookieOptions).toHaveProperty('isSecure')
    expect(crumbPlugin.options.cookieOptions.isSecure).toEqual(false)
  })

  describe('Skip Function', () => {
    let server

    beforeAll(async () => {
      server = Hapi.server()

      await server.register(crumbPlugin)

      server.route({
        method: 'POST',
        path: `${config.urlPrefix}/cookies`,
        handler: (request, h) => {
          return h.response('ok').code(200)
        }
      })
      server.route({
        method: 'POST',
        path: `${config.urlPrefix}/other`,
        handler: (request, h) => {
          return h.response('ok').code(200)
        }
      })

      await server.initialize()
    })

    afterAll(async () => {
      await server.stop()
    })

    test('should skip crumb token changes for /cookies endpoint', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `${config.urlPrefix}/cookies`
      })

      expect(response.statusCode).toBe(200)
    })

    test('should generate and validate crumb token for other endpoints', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `${config.urlPrefix}/other`
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
