import Wreck from '@hapi/wreck'
import { getToken } from '../../../../../app/session/index.js'
import { decodeJwt } from '../../../../../app/auth/token-verify/jwt-decode.js'
import { get } from '../../../../../app/api-requests/rpa-api/base.js'

jest.mock('../../../../../app/session/index')
jest.mock('@hapi/wreck')
jest.mock('../../../../../app/auth/token-verify/jwt-decode')

jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    ...originalModule,
    authConfig: {
      apim: {
        ocpSubscriptionKey: 'ocpSubscriptionKey'
      },
      defraId: {
        hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
        oAuthAuthorisePath: '/oauth2/v2.0/authorize',
        policy: 'b2c_1a_signupsigninsfi',
        dashboardRedirectUri: 'http://localhost:3003/signin-oidc',
        clientId: 'dummy_client_id',
        serviceId: 'dummy_service_id',
        scope: 'openid dummy_client_id offline_access'
      },
      ruralPaymentsAgency: {
        hostname: 'dummy-host-name',
        getPersonSummaryUrl: 'dummy-get-person-summary-url',
        getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
        getOrganisationUrl: 'dummy-get-organisation-url'
      }
    },
    wreckHttp: {
      timeoutMilliseconds: 10000
    }
  }
})

describe('Base', () => {
  test('when get called - returns valid payload', async () => {
    const hostname = 'https://testhost'
    const url = '/get/test'
    const contactName = 'Mr Smith'
    const accessToken = 'access_token'
    const apimOcpSubscriptionKey = 'apim-ocp-subscription-key'
    const contactId = 1234567
    const wreckResponse = {
      payload: {
        name: contactName,
        id: contactId
      },
      res: {
        statusCode: 200
      }
    }

    const headers = {}
    headers['X-Forwarded-Authorization'] = accessToken
    headers['Ocp-Apim-Subscription-Key'] = apimOcpSubscriptionKey

    const options = {
      headers,
      json: true,
      rejectUnauthorized: false,
      timeout: 10000
    }
    Wreck.get = jest.fn(async function (_url, _options) {
      return wreckResponse
    })

    getToken.mockResolvedValueOnce(accessToken)
    decodeJwt.mockResolvedValue(contactId)

    const result = await get(hostname, url, expect.anything(), expect.anything())

    expect(result).not.toBeNull()
    expect(result.name).toMatch(contactName)
    expect(result.id).toEqual(contactId)
    expect(Wreck.get).toHaveBeenCalledTimes(1)
    expect(Wreck.get).toHaveBeenCalledWith(`${hostname}${url}`, options)
  })

  test('when called and error occurs, throwns error', async () => {
    const hostname = 'https://testhost'
    const url = '/get/test'
    const contactId = 1234567
    const accessToken = 'access_token'
    const error = new Error('Test error in base')

    Wreck.get = jest.fn(async function (_url, _options) {
      throw error
    })

    getToken.mockResolvedValueOnce(accessToken)
    decodeJwt.mockResolvedValue(contactId)

    await expect(async () =>
      await get(hostname, url, expect.anything(), expect.anything())
    ).rejects.toThrowError(error)
  })
})
