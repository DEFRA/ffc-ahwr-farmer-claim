const { resetAllWhenMocks } = require('jest-when')
let processEligibleBusinesses
const MOCK_NOW = new Date()
let logSpy
let dateSpy
let applicationApi

describe('Eligible businesses', () => {
  beforeAll(() => {
    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => MOCK_NOW)
    Date.now = jest.fn(() => MOCK_NOW.valueOf())

    logSpy = jest.spyOn(console, 'log')

    applicationApi = require('../../../../../app/api-requests/application-service-api')
    jest.mock('../../../../../app/api-requests/application-service-api')

    processEligibleBusinesses = require('../../../../../app/routes/models/eligible-businesses')
  })

  beforeEach(() => {
    jest.clearAllMocks()
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
    applicationApi.getLatestApplicationForEachSbi.mockResolvedValueOnce(
      [
        {
          id: '48d2f147-614e-40df-9ba8-9961e7974e83',
          reference: 'AHWR-48D2-F147',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'sheep',
            organisation: {
              crn: '112222',
              sbi: '122333',
              name: 'My Amazing Farm',
              email: 'liam.wilson@kainos.com',
              address: '1 Some Road',
              farmerName: 'Mr Farmer'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2023-02-01T13: 52: 14.176Z',
          updatedAt: '2023-02-01T13: 52: 14.207Z',
          createdBy: 'admin',
          updatedBy: null,
          statusId: 1
        },
        {
          id: '48d2f147-614e-40df-9ba8-9961e7974e82',
          reference: 'AHWR-48D2-F148',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'pigs',
            organisation: {
              crn: '112222',
              sbi: '123456789',
              name: 'My Beautiful Farm',
              email: 'liam.wilson@kainos.com',
              address: '1 Some Road',
              farmerName: 'Mr Farmer'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2023-02-01T13: 52: 14.176Z',
          updatedAt: '2023-02-01T13: 52: 14.207Z',
          createdBy: 'admin',
          updatedBy: null,
          statusId: 1
        },
        {
          id: '48d2f147-614e-40df-9b568-9961e7974e82',
          reference: 'AHWR-48D2-F149',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'pigs',
            organisation: {
              crn: '112222',
              sbi: '777777',
              name: 'My Beautiful Farm',
              email: 'liam.wilson@kainos.com',
              address: '1 Some Road',
              farmerName: 'Mr Farmer'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2023-02-01T13: 52: 14.176Z',
          updatedAt: '2023-02-01T13: 52: 14.207Z',
          createdBy: 'admin',
          updatedBy: null,
          statusId: 5
        }
      ]
    )
    const result = await processEligibleBusinesses('someemaiL@email.com')
    expect(result.length).toBe(2)
    expect(applicationApi.getLatestApplicationForEachSbi).toBeCalledTimes(1)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
  })

  test('test null application response handles', async () => {
    applicationApi.getLatestApplicationForEachSbi.mockResolvedValueOnce(null)
    const result = await processEligibleBusinesses('someemaiL@email.com')
    expect(result.length).toBe(0)
    expect(applicationApi.getLatestApplicationForEachSbi).toBeCalledTimes(1)
  })
})
