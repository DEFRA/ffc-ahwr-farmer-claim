import { resetAllWhenMocks, when } from 'jest-when'
import { sessionKeys } from '../../../../app/session/keys.js'
import { getPkcecodes, getToken, setCustomer, setToken } from '../../../../app/session/index.js'
import wreck from '@hapi/wreck'
import jwktopem from 'jwk-to-pem'
import { authenticate } from '../../../../app/auth/authenticate.js'
import { verify } from 'jsonwebtoken'

const MOCK_NOW = new Date()
const MOCK_JWT_VERIFY = jest.fn()
const MOCK_COOKIE_AUTH_SET = jest.fn()

jest.mock('../../../../app/session')
jest.mock('@hapi/wreck')
jest.mock('jwk-to-pem')

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue(true),
  decode: jest.requireActual('jsonwebtoken').decode
}))

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: () => 'hello' }, dispose: jest.fn() }))

jest.mock('../../../../app/config/auth.js', () => ({
  authConfig: {
    defraId: {
      hostname: 'https://tenantname.b2clogin.com/tenantname.onmicrosoft.com',
      tenantName: 'tenantname',
      oAuthAuthorisePath: '/oauth2/v2.0/authorize',
      policy: 'b2c_1a_signupsigninsfi',
      redirectUri: 'http://localhost:3000/apply/signin-oidc',
      clientId: 'dummy_client_id',
      clientSecret: 'dummy_client_secret',
      serviceId: 'dummy_service_id',
      scope: 'openid dummy_client_id offline_access',
      jwtIssuerId: 'jwtissuerid'
    }
  }
}))

describe('authenticate', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  test.each([
    {
      toString: () => 'authenticate',
      given: {
        request: {
          query: {
            state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
            code: 'query_code'
          },
          cookieAuth: {
            set: MOCK_COOKIE_AUTH_SET
          },
          logger: {
            setBindings: jest.fn()
          }
        }
      },
      when: {
        session: {
          state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
          pkcecodes: {
            verifier: 'verifier'
          }
        },
        jwktopem: 'public_key',
        acquiredSigningKey: {
          signingKey: 'signing_key'
        },
        redeemResponse: {
          res: {
            statusCode: 200
          },
          payload: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vand0aXNzdWVyaWQvdjIuMC8iLCJyb2xlcyI6WyI1Mzg0NzY5OkFnZW50OjMiXSwiY29udGFjdElkIjoiMTIzNDU2Nzg5MCIsImN1cnJlbnRSZWxhdGlvbnNoaXBJZCI6IjEyMzQ1Njc4OSJ9.pYC2VTlSnlIsLn4MknJl0YhLPCn2oW6K73FKFgzvAqE',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: undefined
      }
    },
    {
      toString: () => 'authenticate - iss not trusted',
      given: {
        request: {
          query: {
            state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
            code: 'query_code'
          },
          cookieAuth: {
            set: MOCK_COOKIE_AUTH_SET
          },
          logger: {
            setBindings: jest.fn()
          }
        }
      },
      when: {
        session: {
          state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
          pkcecodes: {
            verifier: 'verifier'
          }
        },
        jwktopem: 'public_key',
        acquiredSigningKey: {
          signingKey: 'signing_key'
        },
        redeemResponse: {
          res: {
            statusCode: 200
          },
          payload: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new Error('Issuer not trusted: https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/')
      }
    },
    {
      toString: () => 'authenticate - jwtVerify error',
      given: {
        request: {
          query: {
            state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
            code: 'query_code'
          },
          cookieAuth: {
            set: MOCK_COOKIE_AUTH_SET
          },
          logger: {
            setBindings: jest.fn()
          }
        }
      },
      when: {
        session: {
          state: 'eyJpZCI6IjgyN2E0NmEyLTEzZGQtNGI4MC04MzM1LWQxZDZhNTVlNmY3MSJ9',
          pkcecodes: {
            verifier: 'verifier'
          }
        },
        jwktopem: 'WRONG_KEY!!!',
        acquiredSigningKey: {
          signingKey: 'signing_key'
        },
        redeemResponse: {
          res: {
            statusCode: 200
          },
          payload: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new Error('The token has not been verified')
      }
    }
  ])('%s', async (testCase) => {
    verify.mockReturnValue(!testCase.toString().includes('jwtVerify error'))

    when(getToken)
      .calledWith(testCase.given.request, sessionKeys.tokens.state)
      .mockReturnValue(testCase.when.session.state)
    when(getPkcecodes)
      .calledWith(testCase.given.request, sessionKeys.pkcecodes.verifier)
      .mockReturnValue(testCase.when.session.pkcecodes.verifier)
    when(wreck.post)
      .calledWith(
        'https://tenantname.b2clogin.com/tenantname.onmicrosoft.com/b2c_1a_signupsigninsfi/oauth2/v2.0/token',
        {
          headers: expect.anything(),
          payload: expect.anything(),
          json: true
        }
      )
      .mockResolvedValue(testCase.when.redeemResponse)
    when(wreck.get)
      .calledWith(
        'https://tenantname.b2clogin.com/tenantname.onmicrosoft.com/discovery/v2.0/keys?p=b2c_1a_signupsigninsfi',
        { json: true }
      )
      .mockResolvedValue({
        res: {
          statusCode: 200
        },
        payload: {
          keys: [testCase.when.acquiredSigningKey]
        }
      })
    when(jwktopem)
      .calledWith(testCase.when.acquiredSigningKey)
      .mockReturnValue(testCase.when.jwktopem)
    when(MOCK_JWT_VERIFY)
      .calledWith(
        testCase.when.redeemResponse.payload.access_token,
        'public_key',
        { algorithms: ['RS256'], ignoreNotBefore: true }
      )
      .mockResolvedValue('verified')
    when(getToken)
      .calledWith(testCase.given.request, sessionKeys.tokens.nonce)
      .mockReturnValue('123')

    if (testCase.expect.error) {
      await expect(
        authenticate(testCase.given.request)
      ).rejects.toEqual(testCase.expect.error)

      expect(setToken).toHaveBeenCalledTimes(0)
      expect(setCustomer).toHaveBeenCalledTimes(0)
      expect(MOCK_COOKIE_AUTH_SET).toHaveBeenCalledTimes(0)
    } else {
      await authenticate(testCase.given.request)

      expect(setToken).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.tokens.accessToken,
        testCase.when.redeemResponse.payload.access_token
      )
      expect(setToken).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.tokens.tokenExpiry,
        new Date(MOCK_NOW.getTime() + 10 * 1000).toISOString()
      )
      expect(setCustomer).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.customer.crn,
        '1234567890'
      )
      expect(setCustomer).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.customer.organisationId,
        '123456789'
      )
      expect(setCustomer).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.customer.attachedToMultipleBusinesses,
        false
      )
      expect(MOCK_COOKIE_AUTH_SET).toHaveBeenCalledWith({
        account: {
          email: 'john.doe@email.com',
          name: 'John Doe'
        },
        scope: {
          roleNames: [
            'Agent'
          ],
          roles: [
            {
              relationshipId: '5384769',
              roleName: 'Agent',
              status: '3'
            }
          ]
        }
      })
    }
  })
})
