const { when, resetAllWhenMocks } = require('jest-when')
const MOCK_USE_ACTUAL_DECODE = require('jsonwebtoken').decode
const sessionKeys = require('../../../../app/session/keys')

const MOCK_NOW = new Date()
const MOCK_JWT_VERIFY = jest.fn()
const MOCK_COOKIE_AUTH_SET = jest.fn()

describe('authenticate', () => {
  let Wreck
  let jwktopem
  let logSpy
  let session
  let authenticate

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)

    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      authConfig: {
        defraId: {
          clientId: 'clientId',
          clientSecret: 'clientSecret',
          scope: 'scope',
          redirectUri: 'redirectUri',
          hostname: 'hostname',
          tenantName: 'tenantname',
          jwtIssuerId: 'jwtissuerid'
        }
      }
    }))

    jest.mock('../../../../app/session')
    session = require('../../../../app/session')

    jest.mock('@hapi/wreck')
    Wreck = require('@hapi/wreck')

    jest.mock('jwk-to-pem')
    jwktopem = require('jwk-to-pem')

    jest.mock('jsonwebtoken', () => ({
      verify: MOCK_JWT_VERIFY,
      decode: MOCK_USE_ACTUAL_DECODE
    }))

    logSpy = jest.spyOn(console, 'log')

    authenticate = require('../../../../app/auth/authenticate')
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
            state: 'query_state',
            code: 'query_code'
          },
          cookieAuth: {
            set: MOCK_COOKIE_AUTH_SET
          }
        }
      },
      when: {
        session: {
          state: 'query_state',
          pkcecodes: {
            verifier: 'verifier'
          }
        },
        acquiredSigningKey: {
          signingKey: 'signing_key'
        },
        redeemResponse: {
          res: {
            statusCode: 200
          },
          payload: {
            /* Decoded access_token:
            {
              "alg": "HS256",
              "typ": "JWT"
            },
            {
              "sub": "1234567890",
              "name": "John Doe",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@email.com",
              "iat": 1516239022,
              "iss": "https://tenantname.b2clogin.com/jwtissuerid/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vand0aXNzdWVyaWQvdjIuMC8iLCJyb2xlcyI6WyI1Mzg0NzY5OkFnZW50OjMiXSwiY29udGFjdElkIjoiMTIzNDU2Nzg5MCIsImN1cnJlbnRSZWxhdGlvbnNoaXBJZCI6IjEyMzQ1Njc4OSJ9.pYC2VTlSnlIsLn4MknJl0YhLPCn2oW6K73FKFgzvAqE',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Requesting an access token with a client_secret`,
          `${MOCK_NOW.toISOString()} Verifying JWT token: ${JSON.stringify({
            token: 'eyJhb...zvAqE'
          })}`,
          `${MOCK_NOW.toISOString()} Acquiring the signing key data necessary to validate the signature`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...zvAqE'
          })}`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...uRrzk'
          })}`,
          `${MOCK_NOW.toISOString()} Verifying the issuer`,
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`
        ]
      }
    }
  ])('%s', async (testCase) => {
    when(session.getToken)
      .calledWith(testCase.given.request, sessionKeys.tokens.state)
      .mockReturnValue(testCase.when.session.state)
    when(session.getPkcecodes)
      .calledWith(testCase.given.request, sessionKeys.pkcecodes.verifier)
      .mockReturnValue(testCase.when.session.pkcecodes.verifier)
    when(Wreck.post)
      .calledWith(
        'hostname/b2c_1a_signupsigninsfi/oauth2/v2.0/token',
        {
          headers: expect.anything(),
          payload: expect.anything(),
          json: true
        }
      )
      .mockResolvedValue(testCase.when.redeemResponse)
    when(Wreck.get)
      .calledWith(
        'hostname/discovery/v2.0/keys?p=b2c_1a_signupsignin',
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
      .mockReturnValue('public_key')
    when(MOCK_JWT_VERIFY)
      .calledWith(
        testCase.when.redeemResponse.payload.access_token,
        'public_key',
        { algorithms: ['RS256'], ignoreNotBefore: true }
      )
      .mockResolvedValue('verified')
    when(session.getToken)
      .calledWith(testCase.given.request, sessionKeys.tokens.nonce)
      .mockReturnValue('123')

    await authenticate(testCase.given.request)

    expect(session.setToken).toHaveBeenCalledWith(
      testCase.given.request,
      sessionKeys.tokens.accessToken,
      testCase.when.redeemResponse.payload.access_token
    )
    expect(session.setToken).toHaveBeenCalledWith(
      testCase.given.request,
      sessionKeys.tokens.tokenExpiry,
      new Date(MOCK_NOW.getTime() + 10 * 1000).toISOString()
    )
    expect(session.setCustomer).toHaveBeenCalledWith(
      testCase.given.request,
      sessionKeys.customer.crn,
      '1234567890'
    )
    expect(session.setCustomer).toHaveBeenCalledWith(
      testCase.given.request,
      sessionKeys.customer.organisationId,
      '123456789'
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
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
  })
})