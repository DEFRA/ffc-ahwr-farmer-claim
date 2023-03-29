const { when, resetAllWhenMocks } = require('jest-when')
const { v4: uuidv4 } = require('uuid')
const nonce = require('../../../../../app/auth/id-token/nonce')
const session = require('../../../../../app/session')
const sessionKeys = require('../../../../../app/session/keys')

jest.mock('uuid')
jest.mock('../../../../../app/session')

const MOCK_NOW = new Date()

describe('nonce', () => {
  let logSpy
  let errorSpy

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)

    logSpy = jest.spyOn(console, 'log')
    errorSpy = jest.spyOn(console, 'error')
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
      toString: () => 'generate',
      given: {
        request: {
        }
      },
      when: {
        uuidv4: 'random_uuidv4'
      },
      expect: {
        consoleLogs: [
        ]
      }
    }
  ])('%s', async (testCase) => {
    when(uuidv4).calledWith().mockReturnValue(testCase.when.uuidv4)

    const randomNonce = nonce.generate(testCase.given.request)

    expect(session.setToken).toHaveBeenCalledWith(
      testCase.given.request,
      sessionKeys.tokens.nonce,
      randomNonce
    )
    expect(randomNonce).toEqual(testCase.when.uuidv4)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
  })

  test.each([
    {
      toString: () => 'verify - Empty id_token',
      given: {
        request: {
        }
      },
      when: {
        uuidv4: 'random_uuidv4',
        session: {}
      },
      expect: {
        result: false,
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`,
          `${MOCK_NOW.toISOString()} Error while verifying id_token nonce: Empty id_token`
        ],
        errorLogs: [
          new Error('Empty id_token')
        ]
      }
    },
    {
      toString: () => 'verify - HTTP Session contains no nonce',
      given: {
        request: {
        },
        idToken: {
        }
      },
      when: {
        uuidv4: 'random_uuidv4',
        session: {}
      },
      expect: {
        result: false,
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`,
          `${MOCK_NOW.toISOString()} Error while verifying id_token nonce: HTTP Session contains no nonce`
        ],
        errorLogs: [
          new Error('HTTP Session contains no nonce')
        ]
      }
    },
    {
      toString: () => 'verify - Nonce mismatch',
      given: {
        request: {
        },
        idToken: {
          nonce: '321'
        }
      },
      when: {
        uuidv4: 'random_uuidv4',
        session: {
          nonce: '123'
        }
      },
      expect: {
        result: false,
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`,
          `${MOCK_NOW.toISOString()} Error while verifying id_token nonce: Nonce mismatch`
        ],
        errorLogs: [
          new Error('Nonce mismatch')
        ]
      }
    },
    {
      toString: () => 'verify - ok',
      given: {
        request: {
        },
        idToken: {
          nonce: '321'
        }
      },
      when: {
        uuidv4: 'random_uuidv4',
        session: {
          nonce: '321'
        }
      },
      expect: {
        result: true,
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Verifying id_token nonce`
        ],
        errorLogs: [
        ]
      }
    }
  ])('%s', async (testCase) => {
    when(uuidv4).calledWith().mockReturnValue(testCase.when.uuidv4)
    when(session.getToken)
      .calledWith(
        testCase.given.request,
        sessionKeys.tokens.nonce
      )
      .mockReturnValue(testCase.when.session.nonce)

    const result = nonce.verify(testCase.given.request, testCase.given.idToken)

    expect(result).toEqual(testCase.expect.result)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
    testCase.expect.errorLogs.forEach(
      (errorLog, idx) => expect(errorSpy).toHaveBeenNthCalledWith(idx + 1, errorLog)
    )
  })
})
