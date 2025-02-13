import wreck from '@hapi/wreck'
import { retrieveApimAccessToken } from '../../../../../app/auth/client-credential-grant/retrieve-apim-access-token.js'

jest.mock('@hapi/wreck')

jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    ...originalModule,
    authConfig: {
      defraId: {
        hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
        oAuthAuthorisePath: '/oauth2/v2.0/authorize',
        policy: 'b2c_1a_signupsigninsfi',
        redirectUri: 'http://localhost:3000/apply/signin-oidc',
        clientId: 'dummy_client_id',
        serviceId: 'dummy_service_id',
        scope: 'openid dummy_client_id offline_access'
      },
      ruralPaymentsAgency: {
        hostname: 'dummy-host-name',
        getPersonSummaryUrl: 'dummy-get-person-summary-url',
        getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
        getOrganisationUrl: 'dummy-get-organisation-url'
      },
      apim: {
        ocpSubscriptionKey: 'dummy-ocp-subscription-key',
        hostname: 'dummy-host-name',
        oAuthPath: 'dummy-oauth-path',
        clientId: 'dummy-client-id',
        clientSecret: 'dummy-client-secret',
        scope: 'dummy-scope'
      }
    },
    wreckHttp: {
      timeoutMilliseconds: 1000
    }
  }
})

describe('Retrieve apim access token', () => {
  test('when retrieveApimAccessToken called - returns valid access token', async () => {
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

    wreck.post = jest.fn().mockResolvedValueOnce(wreckResponse)

    const result = await retrieveApimAccessToken()

    expect(result).toBe(`${tokenType} ${token}`)
    expect(wreck.post).toHaveBeenCalledTimes(1)
  })

  test('when retrieveApimAccessToken called - error thrown when not 200 status code', async () => {
    const wreckResponse = {
      res: {
        statusCode: 404,
        statusMessage: 'Call failed'
      }
    }

    wreck.post = jest.fn().mockRejectedValueOnce(wreckResponse)

    const request = { logger: { setBindings: jest.fn() } }
    await expect(async () =>
      await retrieveApimAccessToken(request)
    ).rejects.toEqual(wreckResponse)

    expect(wreck.post).toHaveBeenCalledTimes(1)
  })
})
