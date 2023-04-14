const refreshClientCredentialToken = require('../../../../../app/auth/client-credential-grant/refresh-client-credential-token')
const mockUtils = require('../../../../../app/auth/client-credential-grant/utils')
jest.mock('../../../../../app/auth/client-credential-grant/utils')

const Wreck = require('@hapi/wreck')
jest.mock('@hapi/wreck')

jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    ...originalModule,
    authConfig: {
      apim: {
        hostname: 'hostname'
      },
      defraId: {
        tenantName: 'tenantName'
      }
    },
    wreckHttp: {
      timeoutMilliseconds: 1000
    }
  }
})

describe('Refresh client credential token', () => {
  test('when refreshClientCredentialToken called - returns valid access token', async () => {
    const tokenType = 'Bearer'
    const token = 'access-token'
    const wreckResponse = {
      payload: {
        token_type: tokenType,
        access_token: token
      },
      res: {
        statusCode: 200
      }
    }

    Wreck.post = jest.fn(async function (_url, _options) {
      return wreckResponse
    })

    const result = await refreshClientCredentialToken()

    expect(result).not.toBeNull()
    expect(result).toMatch(`${tokenType} ${token}`)
    expect(Wreck.post).toHaveBeenCalledTimes(1)
    expect(mockUtils.cacheClientCredentialToken).toHaveBeenCalledTimes(1)
  })

  test('when refreshClientCredentialToken called - error thrown when not 200 status code', async () => {
    const error = new Error('HTTP 404 (Call failed)')
    const wreckResponse = {
      res: {
        statusCode: 404,
        statusMessage: 'Call failed'
      }
    }

    Wreck.post = jest.fn(async function (_url, _options) {
      return wreckResponse
    })

    expect(async () =>
      await refreshClientCredentialToken()
    ).rejects.toThrowError(error)

    expect(Wreck.post).toHaveBeenCalledTimes(1)
  })
})
