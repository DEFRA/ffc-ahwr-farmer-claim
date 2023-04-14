
const getClientCredentials = require('../../../../../app/auth/client-credential-grant/client-credential-grant')
const mockUtils = require('../../../../../app/auth/client-credential-grant/utils')
const mockRefresh = require('../../../../../app/auth/client-credential-grant/refresh-client-credential-token')
const MOCK_NOW = new Date()
jest.mock('../../../../../app/auth/client-credential-grant/utils')
jest.mock('../../../../../app/auth/client-credential-grant/refresh-client-credential-token')

describe('Get client credential grant', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('when getClientCredentials called and valid credential found, then return the access token', async () => {
    const token = 'access-token'
    const tokenType = 'Bearer'
    const expectedToken = `${tokenType} ${token}`
    const clientCredentials = {
      token: {
        token_type: tokenType,
        access_token: token
      }
    }

    mockUtils.lookupClientCredentialToken.mockReturnValueOnce(clientCredentials)
    mockUtils.clientCredentialsValid.mockReturnValueOnce(true)

    const result = await getClientCredentials()

    expect(result).not.toBeNull()
    expect(result).toMatch(expectedToken)
    expect(mockUtils.lookupClientCredentialToken).toBeCalledTimes(1)
    expect(mockUtils.clientCredentialsValid).toBeCalledTimes(1)
  })

  test('when getClientCredentials called and invalid credential found, then refresh credentials and return the access token', async () => {
    const token = 'access-token'
    const tokenType = 'Bearer'
    const expectedToken = `${tokenType} ${token}`
    const clientCredentials = {}

    mockUtils.lookupClientCredentialToken.mockReturnValueOnce(clientCredentials)
    mockUtils.clientCredentialsValid.mockReturnValueOnce(false)
    mockRefresh.mockReturnValueOnce(expectedToken)

    const result = await getClientCredentials()

    expect(result).not.toBeNull()
    expect(result).toMatch(expectedToken)
    expect(mockUtils.lookupClientCredentialToken).toBeCalledTimes(1)
    expect(mockUtils.clientCredentialsValid).toBeCalledTimes(1)
    expect(mockRefresh).toBeCalledTimes(1)
  })

  test('when getClientCredentials called - returns error', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log')
    const consoleErrorSpy = jest.spyOn(console, 'error')
    const error = new Error('Credentials not found')

    mockUtils.lookupClientCredentialToken.mockImplementation(() => {
      throw error
    })

    expect(async () =>
      await getClientCredentials()
    ).rejects.toThrowError(error)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, `${MOCK_NOW.toISOString()} Retrieving client credentials from cache`)
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, `${MOCK_NOW.toISOString()} Error getting client credentials: ${JSON.stringify(error.message)}`)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(error)
  })
})
