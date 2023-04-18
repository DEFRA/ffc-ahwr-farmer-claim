const utils = require('../../../../../app/auth/client-credential-grant/utils')
let cacheData = {}
const requestGetMock = {
  server:
  {
    app:
    {
      clientCredentialCache: {
        get: (key) => {
          return cacheData[key]
        },
        set: (key, value) => {
          cacheData[key] = value
        }
      }
    }
  }
}

describe('Client credential grant utilities', () => {
  beforeEach(() => {
    cacheData = {}
    jest.resetAllMocks()
  })

  test('When lookupClientCredentialToken called and cache exists, token is returned', async () => {
    const tokenType = 'Bearer'
    const accessToken = 'abc123'
    const expiresIn = 3599
    const clientCredentials = {
      token_type: tokenType,
      access_token: accessToken,
      expires_in: expiresIn
    }
    requestGetMock.server.app.clientCredentialCache.set('Client_Credential', clientCredentials)

    const result = await utils.lookupClientCredentialToken(requestGetMock)
    expect(result.token_type).toEqual(tokenType)
    expect(result.access_token).toEqual(accessToken)
    expect(result.expires_in).toEqual(expiresIn)
  })

  test('When lookupClientCredentialToken called and no cache exists, no token is returned', async () => {
    const result = await utils.lookupClientCredentialToken(requestGetMock)
    expect(result).toEqual({})
  })

  test('When cacheClientCredentialToken called, token is cached', async () => {
    const tokenType = 'Bearer'
    const accessToken = 'abc123'
    const expiresIn = 3599
    const expectedExpiryDate = new Date()
    expectedExpiryDate.setSeconds(expectedExpiryDate.getSeconds() + expiresIn - (5 * 60))
    const clientCredentials = {
      token_type: tokenType,
      access_token: accessToken,
      expires_in: expiresIn
    }

    await utils.cacheClientCredentialToken(requestGetMock, clientCredentials)
    expect(cacheData.Client_Credential.token.token_type).toEqual(tokenType)
    expect(cacheData.Client_Credential.token.access_token).toEqual(accessToken)
    expect(cacheData.Client_Credential.token.expires_in).toEqual(expiresIn)
  })

  test('When clientCredentialsValid called and client credentials are valid, result is true', () => {
    const MOCK_NOW_PLUS_1_DAY = new Date()
    MOCK_NOW_PLUS_1_DAY.setSeconds(MOCK_NOW_PLUS_1_DAY.getSeconds() + (60 * 60 * 24))

    jest.useFakeTimers()
    jest.setSystemTime(new Date())
    const clientCredentials = {
      token: {
        token_type: 'Bearer',
        access_token: 'ABC123'
      },
      expiry_date: MOCK_NOW_PLUS_1_DAY.toISOString()
    }

    const result = utils.clientCredentialsValid(clientCredentials)
    expect(result).toBeTruthy()
  })

  test.each([
    { clientCredentials: null },
    { clientCredentials: {} }
  ])('When clientCredentialsValid called and %p, result is false', (clientCredentials) => {
    const result = utils.clientCredentialsValid(clientCredentials)
    expect(result).toBeFalsy()
  })

  test('When clientCredentialsValid called and credentials have expired, result is false', () => {
    const MOCK_NOW_MINUS_1_DAY = new Date()
    MOCK_NOW_MINUS_1_DAY.setSeconds(MOCK_NOW_MINUS_1_DAY.getSeconds() - (60 * 60 * 24))

    jest.useFakeTimers()
    jest.setSystemTime(new Date())
    const clientCredentials = {
      token: {
        token_type: 'Bearer',
        access_token: 'ABC123'
      },
      expiry_date: MOCK_NOW_MINUS_1_DAY.toISOString()
    }

    const result = utils.clientCredentialsValid(clientCredentials)
    expect(result).toBeFalsy()
  })
})
