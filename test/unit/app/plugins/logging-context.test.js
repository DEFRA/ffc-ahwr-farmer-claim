const Hapi = require('@hapi/hapi')
const loggingContextPlugin = require('../../../../app/plugins/logging-context')
const loggerPlugin = require('../../../../app/plugins/logger')
const config = require('../../../../app/config')

jest.mock('../../../../app/session', () => ({
  getEndemicsClaim: (_) => ({
    organisation: {
      sbi: 'sbi123',
      crn: 'crn123'
    },
    reference: 'ABC-123',
    latestEndemicsApplication: {
      reference: 'APPLICATION1'
    }
  })
}))
jest.mock('../../../../app/config', () => ({
  ...jest.requireActual('../../../../app/config'),
  urlPrefix: '/claim'
}))

describe('Logging context plugin', () => {
  let server
  let logBindings
  beforeAll(async () => {
    server = Hapi.server()

    await server.register(loggingContextPlugin)
    await server.register(loggerPlugin)

    server.route({
      method: 'GET',
      path: `${config.urlPrefix}/route1`,
      handler: (request, h) => {
        logBindings = request.logger.bindings()
        return h.response('ok').code(200)
      }
    })
    server.route({
      method: 'GET',
      path: `${config.urlPrefix}/route2`,
      handler: (request, h) => {
        request.logger.setBindings({
          extra: 'new-value'
        })
        logBindings = request.logger.bindings()
        return h.response('ok').code(200)
      }
    })

    await server.initialize()
  })

  afterEach(() => {
    logBindings = undefined
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should add contextual items to logs', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `${config.urlPrefix}/route1`
    })

    expect(response.statusCode).toBe(200)
    expect(logBindings.sbi).toEqual('sbi123')
    expect(logBindings.crn).toEqual('crn123')
    expect(logBindings.reference).toEqual('ABC-123')
    expect(logBindings.applicationReference).toEqual('APPLICATION1')
  })

  test('specific contextual items can be mixed in', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `${config.urlPrefix}/route2`
    })

    expect(response.statusCode).toBe(200)
    expect(logBindings.extra).toEqual('new-value')
    expect(logBindings.sbi).toEqual('sbi123')
    expect(logBindings.crn).toEqual('crn123')
    expect(logBindings.reference).toEqual('ABC-123')
    expect(logBindings.applicationReference).toEqual('APPLICATION1')
  })
})
