const uuidRegex = require('../../../../app/config/uuid-regex')

describe('Get Token test', () => {
  const testEmail = 'test@unit-test.com'
  const testToken = '644a2a30-7487-4e98-a908-b5ecd82d5225'

  let config
  let users

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    config = require('../../../../app/config')
    jest.mock('../../../../app/config')
    users = require('../../../../app/api-requests/users')
    jest.mock('../../../../app/api-requests/users')
  })

  test('when test token exists and user is test user, return test token', async () => {
    config.notifyConfig.testToken = testToken
    users.getByEmail.mockResolvedValue({ email: testEmail, isTest: true })
    const getToken = require('../../../../app/lib/auth/get-token')

    const response = await getToken(testEmail)

    expect(response).toBe(testToken)
    expect(users.getByEmail).toHaveBeenCalledTimes(1)
    expect(users.getByEmail).toHaveBeenCalledWith(testEmail)
  })

  test('when test token exists and user is not test user, return uuid token', async () => {
    config.notifyConfig.testToken = testToken
    users.getByEmail.mockResolvedValue({ email: testEmail })
    const getToken = require('../../../../app/lib/auth/get-token')

    const response = await getToken(testEmail)

    expect(response).not.toBe(testToken)
    expect(users.getByEmail).toHaveBeenCalledTimes(1)
    expect(users.getByEmail).toHaveBeenCalledWith(testEmail)
  })

  test('when test token does not exist, return uuid token', async () => {
    config.notifyConfig.testToken = null
    const getToken = require('../../../../app/lib/auth/get-token')
    const response = await getToken('email@test.com')

    expect(response).not.toBe(testToken)
    expect(response).toMatch(new RegExp(uuidRegex))
    expect(users.getByEmail).toHaveBeenCalledTimes(0)
  })
})
