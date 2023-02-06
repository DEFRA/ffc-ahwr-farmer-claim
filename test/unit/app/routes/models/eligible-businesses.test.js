const { resetAllWhenMocks } = require('jest-when')
const processEligibleBusinesses = require('../../../../../app/routes/models/eligible-businesses')
const MOCK_NOW = new Date()
let logSpy
let dateSpy

describe('Eligible businesses', () => {
  beforeAll(() => {
    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => MOCK_NOW)
    Date.now = jest.fn(() => MOCK_NOW.valueOf())

    logSpy = jest.spyOn(console, 'log')
  })

  afterAll(() => {
    jest.clearAllMocks()
    jest.resetModules()
    resetAllWhenMocks()
    dateSpy.mockRestore()
  })

  test.each([
    {
      toString: () => 'Business returned',
      given: {
      },
      when: {
      },
      expect: {
        consoleLogs: [
                `${MOCK_NOW.toISOString()} Latest application is eligible to claim : ${JSON.stringify({
                  sbi: '122333'
                })}`,
                `${MOCK_NOW.toISOString()} Latest application is eligible to claim : ${JSON.stringify({
                    sbi: '123456789'
                  })}`,
                  `${MOCK_NOW.toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
                    sbi: '777777'
                  })}`
        ]
      }
    }
  ])('%s', async (testCase) => {
    const result = processEligibleBusinesses()
    expect(result.length).toBe(2)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
  })
})
