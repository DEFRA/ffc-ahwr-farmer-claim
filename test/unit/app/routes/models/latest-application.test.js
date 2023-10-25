const { NoApplicationFoundError, ClaimHasAlreadyBeenMadeError, ClaimHasExpiredError } = require('../../../../../app/exceptions')

describe('Latest Applications Tests', () => {
  let applicationApiMock
  let hasClaimExpiredMock
  let latestApplication

  beforeAll(() => {
    applicationApiMock = require('../../../../../app/api-requests/application-service-api')
    jest.mock('../../../../../app/api-requests/application-service-api')

    hasClaimExpiredMock = require('../../../../../app/lib/claim-has-expired')
    jest.mock('../../../../../app/lib/claim-has-expired')

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
      toString: () => 'Latest Agreed application is returned - multiple records',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [
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
          },
          {
            claimed: true,
            createdAt: '2022-01-17 14:55:20',
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
            statusId: 9,
            updatedAt: '2022-01-17 14:55:20',
            updatedBy: 'David Jones'
          }
        ]
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
      toString: () => 'No applications found',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: []
      },
      expect: {
        error: new NoApplicationFoundError('No application found for SBI - 111111111')
      }
    },
    {
      toString: () => 'NOT_AGREED application found',
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
        error: new NoApplicationFoundError('No claimable application found for SBI - 111111111')
      }
    },
    {
      toString: () => 'READY_TO_PAY application found',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [{
          claimed: true,
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
          statusId: 9,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }]
      },
      expect: {
        error: new ClaimHasAlreadyBeenMadeError('Claim has already been made for SBI - 111111111')
      }
    },
    {
      toString: () => 'IN_CHECK application found',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [{
          claimed: true,
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
          statusId: 5,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }]
      },
      expect: {
        error: new ClaimHasAlreadyBeenMadeError('Claim has already been made for SBI - 111111111')
      }
    },
    {
      toString: () => 'ON_HOLD application found',
      given: {
        sbi: 111111111
      },
      when: {
        latestApplications: [{
          claimed: true,
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
          statusId: 11,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }]
      },
      expect: {
        error: new ClaimHasAlreadyBeenMadeError('Claim has already been made for SBI - 111111111')
      }
    },
    {
      toString: () => 'AGREED but expired application found',
      given: {
        sbi: 111111111
      },
      when: {
        agreementExpired: true,
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
        error: new ClaimHasExpiredError('Claim has expired for reference - AHWR-5C1C-AAAA')
      }
    }
  ])('%s', async (testCase) => {
    if (testCase.when.agreementExpired) {
      hasClaimExpiredMock.claimHasExpired.mockReturnValueOnce(true)
    }
    applicationApiMock.getLatestApplicationsBySbi.mockResolvedValueOnce(testCase.when.latestApplications)
    if (testCase.expect.error) {
      await expect(
        latestApplication(testCase.given.sbi)
      ).rejects.toEqual(testCase.expect.error)
    } else {
      const result = await latestApplication(testCase.given.sbi)
      expect(result).toEqual(testCase.expect.latestApplication)
    }
  })
})
