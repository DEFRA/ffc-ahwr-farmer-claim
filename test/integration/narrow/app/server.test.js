import { createServer } from '../../../../app/server.js'
import { config } from '../../../../app/config/index.js'

describe('Server test', () => {
  test('createServer returns server', async () => {
    const server = await createServer()
    expect(server).toBeDefined()
    expect(server.registrations.auth).toBeDefined()
    expect(server.registrations['dev-auth']).not.toBeDefined()
  })
  test('createServer returns dev configured server', async () => {
    config.isDev = true
    const server = await createServer()
    expect(server).toBeDefined()
    expect(server.registrations.auth).not.toBeDefined()
    expect(server.registrations['dev-auth']).toBeDefined()
  })
})
