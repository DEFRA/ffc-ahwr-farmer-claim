const { when, resetAllWhenMocks } = require('jest-when')
const InvalidStateError = require('../../../../app/auth/auth-code-grant/invalid-state-error')
const MOCK_USE_ACTUAL_DECODE = require('jsonwebtoken').decode
const sessionKeys = require('../../../../app/session/keys')

const MOCK_NOW = new Date()
const MOCK_JWT_VERIFY = jest.fn()
const MOCK_COOKIE_AUTH_SET = jest.fn()

describe('authenticate', () => {
  let Wreck
  let jwktopem
  let logSpy
  let errorSpy
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
          jwtIssuerId: 'jwtissuerid',
          policy: 'policy'
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
    errorSpy = jest.spyOn(console, 'error')

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
      toString: () => 'authenticate - successful',
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
        jwktopem: 'public_key',
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
              "currentRelationshipId": "123456789",
              "enrolmentCount": "2"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vand0aXNzdWVyaWQvdjIuMC8iLCJyb2xlcyI6WyI1Mzg0NzY5OkFnZW50OjMiXSwiY29udGFjdElkIjoiMTIzNDU2Nzg5MCIsImN1cnJlbnRSZWxhdGlvbnNoaXBJZCI6IjEyMzQ1Njc4OSIsImVucm9sbWVudENvdW50IjoiMiJ9.rz2yP1Iar8XOsYRftQ0ANmESjSSNHYRtCH-JI2G0n0A',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: undefined,
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Requesting an access token with a client_secret`,
          `${MOCK_NOW.toISOString()} Verifying JWT token: ${JSON.stringify({
            token: 'eyJhb...G0n0A'
          })}`,
          `${MOCK_NOW.toISOString()} Acquiring the signing key data necessary to validate the signature`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...G0n0A'
          })}`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...uRrzk'
          })}`,
          `${MOCK_NOW.toISOString()} Verifying the issuer`,
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`
        ],
        errorLogs: [
        ]
      }
    },
    {
      toString: () => 'authenticate - request query error found',
      given: {
        request: {
          yar: {
            id: 'req_id'
          },
          query: {
            code: 'query_code',
            error: 'err',
            error_description: 'err_desc'
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
        jwktopem: 'public_key',
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
              "iss": "https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new Error(`Request query error found: ${JSON.stringify({
          request: {
            yar: {
              id: 'req_id'
            },
            query: {
              error_description: 'err_desc'
            }
          }
        })}`),
        consoleLogs: [
        ],
        errorLogs: [
          new Error(`Request query error found: ${JSON.stringify({
            request: {
              yar: {
                id: 'req_id'
              },
              query: {
                error_description: 'err_desc'
              }
            }
          })}`)
        ]
      }
    },
    {
      toString: () => 'authenticate - no state found',
      given: {
        request: {
          yar: {
            id: 'req_id'
          },
          query: {
            code: 'query_code'
          },
          cookieAuth: {
            set: MOCK_COOKIE_AUTH_SET
          }
        }
      },
      when: {
        session: {
          state: 'query_state2',
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
              "iss": "https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new InvalidStateError(`No state found: ${JSON.stringify({
          request: {
            yar: {
              id: 'req_id'
            }
          }
        })}`),
        consoleLogs: [
        ],
        errorLogs: [
          new InvalidStateError(`No state found: ${JSON.stringify({
            request: {
              yar: {
                id: 'req_id'
              }
            }
          })}`)
        ]
      }
    },
    {
      toString: () => 'authenticate - state mismatch',
      given: {
        request: {
          yar: {
            id: 'req_id'
          },
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
          state: 'query_state2',
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
              "iss": "https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new InvalidStateError(`State mismatch: ${JSON.stringify({
          request: {
            yar: {
              id: 'req_id'
            }
          }
        })}`),
        consoleLogs: [
        ],
        errorLogs: [
          new InvalidStateError(`State mismatch: ${JSON.stringify({
            request: {
              yar: {
                id: 'req_id'
              }
            }
          })}`)
        ]
      }
    },
    {
      toString: () => 'authenticate - iss not trusted',
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
        jwktopem: 'public_key',
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
              "iss": "https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new Error('Issuer not trusted: https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/'),
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Requesting an access token with a client_secret`,
          `${MOCK_NOW.toISOString()} Verifying JWT token: ${JSON.stringify({
            token: 'eyJhb...n-6jI'
          })}`,
          `${MOCK_NOW.toISOString()} Acquiring the signing key data necessary to validate the signature`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...n-6jI'
          })}`,
          `${MOCK_NOW.toISOString()} Decoding JWT token: ${JSON.stringify({
            token: 'eyJhb...uRrzk'
          })}`,
          `${MOCK_NOW.toISOString()} Verifying the issuer`,
          `${MOCK_NOW.toISOString()} Error while verifying the issuer: Issuer not trusted: https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/`
        ],
        errorLogs: [
          new Error('Issuer not trusted: https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/')
        ]
      }
    },
    {
      toString: () => 'authenticate - jwtVerify error',
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
        jwktopem: 'WRONG_KEY!!!',
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
              "iss": "https://tenantname.b2clogin.com/WRONG_JWT_ISSUER_ID/v2.0/",
              "roles": [
                "5384769:Agent:3"
              ],
              "contactId": "1234567890",
              "currentRelationshipId": "123456789"
            } */
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBlbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vdGVuYW50bmFtZS5iMmNsb2dpbi5jb20vV1JPTkdfSldUX0lTU1VFUl9JRC92Mi4wLyIsInJvbGVzIjpbIjUzODQ3Njk6QWdlbnQ6MyJdLCJjb250YWN0SWQiOiIxMjM0NTY3ODkwIiwiY3VycmVudFJlbGF0aW9uc2hpcElkIjoiMTIzNDU2Nzg5In0.CIzX3BNGBXDLfDbZ0opb3N9jFJv5tYQjQsB_Nrn-6jI',
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJub25jZSI6IjEyMyJ9.EFgheK9cJjMwoszwDYbf9n_XF8NJ3qBvLYqUB8uRrzk',
            expires_in: 10
          }
        }
      },
      expect: {
        error: new Error('The token has not been verified'),
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Requesting an access token with a client_secret`,
          `${MOCK_NOW.toISOString()} Verifying JWT token: ${JSON.stringify({
            token: 'eyJhb...n-6jI'
          })}`,
          `${MOCK_NOW.toISOString()} Acquiring the signing key data necessary to validate the signature`,
          `${MOCK_NOW.toISOString()} Error while verifying JWT token: The token has not been verified`
        ],
        errorLogs: [
          new Error('The token has not been verified')
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
        'hostname/policy/oauth2/v2.0/token',
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
      .mockReturnValue(testCase.when.jwktopem)
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

    if (testCase.expect.error) {
      await expect(
        authenticate(testCase.given.request)
      ).rejects.toEqual(testCase.expect.error)

      expect(session.setToken).toHaveBeenCalledTimes(0)
      expect(session.setCustomer).toHaveBeenCalledTimes(0)
      expect(MOCK_COOKIE_AUTH_SET).toHaveBeenCalledTimes(0)
    } else {
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
      expect(session.setCustomer).toHaveBeenCalledWith(
        testCase.given.request,
        sessionKeys.customer.attachedToMultipleBusinesses,
        true
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
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
    expect(logSpy).toHaveBeenCalledTimes(testCase.expect.consoleLogs.length)

    testCase.expect.errorLogs.forEach(
      (errorLog, idx) => expect(errorSpy).toHaveBeenNthCalledWith(idx + 1, errorLog)
    )
    expect(errorSpy).toHaveBeenCalledTimes(testCase.expect.errorLogs.length)
  })
})
