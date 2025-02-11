import { claimHasExpired } from '../../../../app/lib/claim-has-expired.js'

describe('Has claim expired test', () => {
  afterEach(() => {
    jest.useRealTimers()
  })
  test.each([
    {
      toString: () => 'claim has not expired - 1 second before deadline',
      given: {
        application: {
          claimed: false,
          createdAt: '2021-11-24 08:23:10',
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
      },
      when: {
        currentTime: '2022-05-24 23:59:59'
      },
      expect: {
        hasExpired: false
      }
    },
    {
      toString: () => 'claim has not expired - 1 month before deadline',
      given: {
        application: {
          claimed: false,
          createdAt: '2021-11-24 12:00:00',
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
          reference: 'AHWR-5C1C-AAAB',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      },
      when: {
        currentTime: '2022-04-24 11:59:59'
      },
      expect: {
        hasExpired: false
      }
    },
    {
      toString: () => 'claim has not expired - to midnight of deadline allowed',
      given: {
        application: {
          claimed: false,
          createdAt: '2021-11-24 12:00:00',
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
          reference: 'AHWR-5C1C-AAAC',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      },
      when: {
        currentTime: '2022-05-24 23:59:59:999'
      },
      expect: {
        hasExpired: false
      }
    },
    {
      toString: () => 'claim has expired - 1 millisecond after deadline',
      given: {
        application: {
          claimed: false,
          createdAt: '2021-11-24 12:00:00',
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
          reference: 'AHWR-5C1C-AAAC',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      },
      when: {
        currentTime: '2022-05-24 24:00:00'
      },
      expect: {
        hasExpired: true
      }
    },
    {
      toString: () => 'claim has expired - 1 day after deadline',
      given: {
        application: {
          claimed: false,
          createdAt: '2021-11-24 12:00:00',
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
          reference: 'AHWR-5C1C-AAAD',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      },
      when: {
        currentTime: '2022-05-25 12:00:00'
      },
      expect: {
        hasExpired: true
      }
    }
  ])('%s', async (testCase) => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date(testCase.when.currentTime))
    const result = claimHasExpired(testCase.given.application)
    expect(result).toEqual(testCase.expect.hasExpired)
  })
})
