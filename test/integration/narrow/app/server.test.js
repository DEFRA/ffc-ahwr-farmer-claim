import { createServer } from '../../../../app/server.js'

describe('Server test', () => {
  test('createServer returns server', async () => {
    const server = await createServer()
    expect(server).toBeDefined()
    expect(server.registrations.auth).toBeDefined()
  })
})
