const { when, resetAllWhenMocks } = require('jest-when')
const Wreck = require('@hapi/wreck')
const session = require('../../../../../app/session')
const sessionKeys = require('../../../../../app/session/keys')

jest.mock('@hapi/wreck')
jest.mock('../../../../../app/session')

const MOCK_RPA_HOSTNAME = 'hostname'
const MOCK_TIMEOUT = 1000
const MOCK_OCP_SUB_KEY = 'ocpSubscriptionKey'

describe('CPH check', () => {
  let cphCheck

  beforeAll(() => {
    jest.mock('../../../../../app/config', () => ({
      ...jest.requireActual('../../../../../app/config'),
      authConfig: {
        defraId: {},
        ruralPaymentsAgency: {
          hostname: MOCK_RPA_HOSTNAME,
          getCphNumbersUrl: '...cph/organisation/organisationId/cph-numbers'
        },
        apim: {
          ocpSubscriptionKey: MOCK_OCP_SUB_KEY
        }
      },
      wreckHttp: {
        timeoutMilliseconds: MOCK_TIMEOUT
      }
    }))

    cphCheck = require('../../../../../app/api-requests/rpa-api/cph-check')
  })

  afterAll(() => {
    resetAllWhenMocks()
  })

  test.each([
    {
      toString: () => 'Both CPH numbers are valid',
      given: {
        apimAccessToken: 'apimAccessToken',
        request: {},
        session: {
          accessToken: 'accessToken',
          organisationId: '000111222',
          crn: 'crn'
        }
      },
      when: {
        cphNumbers: [
          {
            cphNumber: '08/178/0064'
          },
          {
            cphNumber: '21/421/0146'
          }
        ]
      },
      expect: {
        error: false
      }
    },
    {
      toString: () => 'Both CPH numbers are invalid',
      given: {
        request: {},
        session: {
          accessToken: 'accessToken',
          apimAccessToken: 'apimAccessToken',
          organisationId: '000111222',
          crn: 'crn'
        }
      },
      when: {
        cphNumbers: [
          {
            cphNumber: '52/178/0064'
          },
          {
            cphNumber: '21/421/8000'
          }
        ]
      },
      expect: {
        error: 'Customer must have at least one valid CPH'
      }
    },
    {
      toString: () => 'Only last CPH is valid',
      given: {
        request: {},
        session: {
          accessToken: 'accessToken',
          apimAccessToken: 'apimAccessToken',
          organisationId: '000111222',
          crn: 'crn'
        }
      },
      when: {
        cphNumbers: [
          {
            cphNumber: '52/178/0064'
          },
          {
            cphNumber: '21/421/8000'
          },
          {
            cphNumber: '21/421/7999'
          }
        ]
      },
      expect: {
        error: false
      }
    },
    {
      toString: () => 'No CPH numbers',
      given: {
        request: {},
        session: {
          accessToken: 'accessToken',
          apimAccessToken: 'apimAccessToken',
          organisationId: '000111222',
          crn: 'crn'
        }
      },
      when: {
        cphNumbers: [
        ]
      },
      expect: {
        error: 'Customer must have at least one valid CPH'
      }
    }
  ])('%s', async (testCase) => {
    when(session.getToken)
      .calledWith(expect.anything(), sessionKeys.tokens.accessToken)
      .mockReturnValue(testCase.given.session.accessToken)
    when(session.getCustomer)
      .calledWith(expect.anything(), sessionKeys.customer.organisationId)
      .mockReturnValue(testCase.given.session.organisationId)
    when(session.getCustomer)
      .calledWith(expect.anything(), sessionKeys.customer.crn)
      .mockReturnValue(testCase.given.session.crn)

    when(Wreck.get)
      .calledWith(
        `${MOCK_RPA_HOSTNAME}...cph/organisation/${testCase.given.session.organisationId}/cph-numbers`,
        {
          headers: {
            'X-Forwarded-Authorization': testCase.given.session.accessToken,
            'Ocp-Apim-Subscription-Key': MOCK_OCP_SUB_KEY,
            Authorization: testCase.given.apimAccessToken,
            crn: testCase.given.session.crn
          },
          json: true,
          rejectUnauthorized: false,
          timeout: MOCK_TIMEOUT
        }
      )
      .mockResolvedValue({
        res: {
          statusCode: 200
        },
        payload: {
          data: testCase.when.cphNumbers,
          success: true
        }
      })

    if (testCase.expect.error) {
      await expect(
        () => cphCheck.customerMustHaveAtLeastOneValidCph(testCase.given.request, testCase.given.apimAccessToken)
      ).rejects.toThrowError(testCase.expect.error)
    } else {
      await expect(
        cphCheck.customerMustHaveAtLeastOneValidCph(testCase.given.request, testCase.given.apimAccessToken)
      ).resolves.toEqual(undefined)
    }
  })
})
