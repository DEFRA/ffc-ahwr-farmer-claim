describe('Latest Applications Tests', () => {
  let applicationApiMock
  let latestApplication

  beforeAll(() => {
    applicationApiMock = require('../../../../../app/api-requests/application-service-api')
    jest.mock('../../../../../app/api-requests/application-service-api')

    latestApplication = require('../../../../../app/routes/models/latest-application')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    {
      toString: () => 'Agreed application is returned',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [{
          claimed: false,
          createdAt: '2023-01-17 14:55:20',
          createdBy: 'David Jones',
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            eligibleSpecies: 'yes',
            offerStatus: 'accepted',
            organisation: {
              address: '1 Example Road',
              crn: 1111111111,
              email: 'business@email.com',
              farmerName: 'Mr Farmer',
              name: 'My Amazing Farm',
              sbi: 111111111
            },
            reference: 'string',
            whichReview: 'sheep'
          },
          id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
          reference: 'AHWR-5C1C-AAAA',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }]
      },
      expect: {
        latestApplication: {
          claimed: false,
          createdAt: '2023-01-17 14:55:20',
          createdBy: 'David Jones',
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            eligibleSpecies: 'yes',
            offerStatus: 'accepted',
            organisation: {
              address: '1 Example Road',
              crn: 1111111111,
              email: 'business@email.com',
              farmerName: 'Mr Farmer',
              name: 'My Amazing Farm',
              sbi: 111111111
            },
            reference: 'string',
            whichReview: 'sheep'
          },
          id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
          reference: 'AHWR-5C1C-AAAA',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      }
    },
    {
      toString: () => 'Agreed application is returned - multiple records',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [[
          {
            claimed: false,
            createdAt: '2023-01-17 14:55:20',
            createdBy: 'David Jones',
            data: {
              confirmCheckDetails: 'yes',
              declaration: true,
              eligibleSpecies: 'yes',
              offerStatus: 'accepted',
              organisation: {
                address: '1 Example Road',
                crn: 1111111111,
                email: 'business@email.com',
                farmerName: 'Mr Farmer',
                name: 'My Amazing Farm',
                sbi: 111111111
              },
              reference: 'string',
              whichReview: 'sheep'
            },
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-AAAA',
            statusId: 1,
            updatedAt: '2023-01-17 14:55:20',
            updatedBy: 'David Jones'
          },
          {
            claimed: false,
            createdAt: '2023-01-17 13:55:20',
            createdBy: 'David Jones',
            data: {
              confirmCheckDetails: 'yes',
              declaration: true,
              eligibleSpecies: 'yes',
              offerStatus: 'accepted',
              organisation: {
                address: '1 Example Road',
                crn: 1111111111,
                email: 'business@email.com',
                farmerName: 'Mr Farmer',
                name: 'My Amazing Farm',
                sbi: 111111111
              },
              reference: 'string',
              whichReview: 'sheep'
            },
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-BBBB',
            statusId: 1,
            updatedAt: '2023-01-17 13:55:20',
            updatedBy: 'David Jones'
          },
          {
            claimed: false,
            createdAt: '2023-01-17 15:55:20',
            createdBy: 'David Jones',
            data: {
              confirmCheckDetails: 'yes',
              declaration: true,
              eligibleSpecies: 'yes',
              offerStatus: 'accepted',
              organisation: {
                address: '1 Example Road',
                crn: 2222222222,
                email: 'business@email.com',
                farmerName: 'Mr Farmer',
                name: 'My Amazing Farm',
                sbi: 222222222
              },
              reference: 'string',
              whichReview: 'sheep'
            },
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-CCCC',
            statusId: 1,
            updatedAt: '2023-01-17 13:55:20',
            updatedBy: 'David Jones'
          },
          {
            claimed: false,
            createdAt: '2023-01-17 16:55:20',
            createdBy: 'David Jones',
            data: {
              confirmCheckDetails: 'yes',
              declaration: true,
              eligibleSpecies: 'yes',
              offerStatus: 'accepted',
              organisation: {
                address: '1 Example Road',
                crn: 2222222222,
                email: 'business@email.com',
                farmerName: 'Mr Farmer',
                name: 'My Amazing Farm',
                sbi: 222222222
              },
              reference: 'string',
              whichReview: 'sheep'
            },
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-DDDD',
            statusId: 1,
            updatedAt: '2023-01-17 13:55:20',
            updatedBy: 'David Jones'
          },
          {
            claimed: false,
            createdAt: '2023-01-17 13:55:20',
            createdBy: 'David Jones',
            data: {
              confirmCheckDetails: 'yes',
              declaration: true,
              eligibleSpecies: 'yes',
              offerStatus: 'accepted',
              organisation: {
                address: '1 Example Road',
                crn: 2222222222,
                email: 'business@email.com',
                farmerName: 'Mr Farmer',
                name: 'My Amazing Farm',
                sbi: 222222222
              },
              reference: 'string',
              whichReview: 'sheep'
            },
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-EEEE',
            statusId: 1,
            updatedAt: '2023-01-17 13:55:20',
            updatedBy: 'David Jones'
          }
        ]]
      },
      expect: {
        latestApplication: null
      }
    },
    {
      toString: () => 'No applications found',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: []
      },
      expect: {
        latestApplication: null
      }
    },
    {
      toString: () => 'Not agreed application returns null',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [{
          claimed: false,
          createdAt: '2023-01-17 14:55:20',
          createdBy: 'David Jones',
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            eligibleSpecies: 'yes',
            offerStatus: 'accepted',
            organisation: {
              address: '1 Example Road',
              crn: 1111111111,
              email: 'business@email.com',
              farmerName: 'Mr Farmer',
              name: 'My Amazing Farm',
              sbi: 111111111
            },
            reference: 'string',
            whichReview: 'sheep'
          },
          id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
          reference: 'AHWR-5C1C-AAAA',
          statusId: 7,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }]
      },
      expect: {
        latestApplication: null
      }
    }
  ])('%s', async (testCase) => {
    applicationApiMock.getLatestApplicationsBySbi.mockResolvedValueOnce(testCase.when.latestApplications)
    const result = await latestApplication(testCase.given.sbi)
    expect(result).toEqual(testCase.expect.latestApplication)
  })
})
