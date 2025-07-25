import wreck from '@hapi/wreck'
import {
  getAmount,
  getClaimsByApplicationReference,
  isCattleEndemicsClaimForOldWorldReview,
  isURNUnique,
  submitNewClaim,
  getReviewTestResultWithinLast10Months
} from '../../../../app/api-requests/claim-service-api.js'
import { getEndemicsClaim } from '../../../../app/session/index.js'

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('@hapi/wreck')
jest.mock('../../../../app/session')

describe('Claim Service API', () => {
  test('Get claims by application reference should return status 200', async () => {
    const mockResponse = {
      res: {
        statusCode: 200,
        statusMessage: 'OK'
      },
      payload: [{}]
    }
    wreck.get.mockResolvedValueOnce(mockResponse)

    const result = await getClaimsByApplicationReference(
      'applicationReference'
    )

    expect(result).toEqual([{}])
  })

  test('Get claims by application reference should return empty array with status 404', async () => {
    const mockResponse = {
      output: {
        statusCode: 404
      }
    }
    wreck.get.mockRejectedValueOnce(mockResponse)

    const result = await getClaimsByApplicationReference(
      'applicationReference'
    )

    expect(result).toEqual([])
  })

  test('Get claims by application reference throws errors', async () => {
    const mockResponse = {
      output: {
        statusCode: 500
      }
    }
    wreck.get.mockRejectedValueOnce(mockResponse)

    const logger = { setBindings: jest.fn() }
    await expect(getClaimsByApplicationReference(
      'applicationReference',
      logger
    )).rejects.toEqual(mockResponse)
  })

  test('Post claim should return status 200', async () => {
    const mockResponse = {
      res: {
        statusCode: 200,
        statusMessage: 'OK'
      },
      payload: 'new claim'
    }
    wreck.post.mockResolvedValueOnce(mockResponse)

    const result = await submitNewClaim(
      'new claim data'
    )

    expect(result).toBe('new claim')
  })

  test('Post claim with invalid data should return status 400', async () => {
    const mockResponse = {
      res: {
        statusCode: 400,
        statusMessage: 'Bad Request'
      }
    }
    wreck.post.mockRejectedValueOnce(mockResponse)

    const logger = { setBindings: jest.fn() }
    await expect(
      submitNewClaim(
        'new claim with invalid data',
        logger
      )
    ).rejects.toEqual(mockResponse)
  })

  test('Check if URN number is unique', async () => {
    const payload = { isURNUnique: true }
    const mockResponse = {
      res: {
        statusCode: 200,
        statusMessage: 'OK'
      },
      payload
    }
    wreck.post.mockResolvedValueOnce(mockResponse)

    const logger = { setBindings: jest.fn() }
    const result = await isURNUnique(
      { sbi: '123456789', laboratoryURN: '1234567' },
      logger
    )

    expect(result).toBe(payload)
  })
  test('Check if URN number throws errors', async () => {
    const mockResponse = {
      res: {
        statusCode: 400,
        statusMessage: 'Bad Request'
      }
    }
    wreck.post.mockRejectedValueOnce(mockResponse)

    const logger = { setBindings: jest.fn() }
    await expect(isURNUnique(
      'new claim with invalid data',
      logger
    )).rejects.toEqual(mockResponse)
  })

  test('Get amount for claim', async () => {
    const payload = 837
    const mockResponse = {
      res: {
        statusCode: 200,
        statusMessage: 'OK'
      },
      payload
    }
    wreck.post.mockResolvedValueOnce(mockResponse)

    const result = await getAmount({ type: 'E', reviewTestResults: 'positive', typeOfLivestock: 'beef', piHunt: 'yes', piHuntAllAnimals: 'yes' })

    expect(result).toBe(payload)
  })

  test('Get amount for claim throws errors', async () => {
    const mockResponse = {
      res: {
        statusCode: 400,
        statusMessage: 'Bad Request'
      }
    }
    wreck.post.mockRejectedValueOnce(mockResponse)

    const logger = { setBindings: jest.fn() }
    await expect(getAmount(
      { type: 'E', reviewTestResults: 'positive', typeOfLivestock: 'beef', piHunt: 'yes', piHuntAllAnimals: 'yes' },
      logger
    )).rejects.toEqual(mockResponse)
  })

  test('Check if the date of testing is less than date of visit', async () => {
    const { isDateOfTestingLessThanDateOfVisit } = require('../../../../app/api-requests/claim-service-api')

    expect(isDateOfTestingLessThanDateOfVisit('2024-04-23', '2024-06-23')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-05-10', '2024-08-23')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-07-23', '2024-08-24')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-09-23', '2024-06-23')).toBe(true)
    expect(isDateOfTestingLessThanDateOfVisit('2024-10-04', '2023-10-23')).toBe(true)
  })

  test('Check if is first time endemic claim for active old world review claim', () => {
    getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'E', typeOfLivestock: 'beef', latestVetVisitApplication: { data: { whichReview: 'beef' } }, previousClaims: [] })

    expect(isCattleEndemicsClaimForOldWorldReview()).toBe(true)
  })

  test('should return false when endemic claim and old review claim are different species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'beef',
      latestVetVisitApplication: { data: { whichReview: 'sheep' } },
      previousClaims: []
    })

    expect(isCattleEndemicsClaimForOldWorldReview()).toBe(false)
  })

  test('getReviewTestResultWithinLast10Months should return testResults when there is a previous review within 10 months and the same species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'beef',
      dateOfVisit: '2025-02-01',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2024-09-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe('positive')
  })

  test('getReviewTestResultWithinLast10Months should return undefined when there are previous reviews within 10 months and not the same species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'beef',
      latestVetVisitApplication: { data: { whichReview: 'sheep' } },
      dateOfVisit: '2025-02-01',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-09-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe(undefined)
  })

  test('getReviewTestResultWithinLast10Months should return undefined when there are previous reviews outside of 10 months and the same species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'beef',
      latestVetVisitApplication: { data: { whichReview: 'sheep' } },
      dateOfVisit: '2025-02-01',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2023-09-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe(undefined)
  })

  test('getReviewTestResultWithinLast10Months should return testResults of the most recent previous same species review when there are multiple previous reviews within 10 months and are different species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'sheep',
      latestVetVisitApplication: { data: { whichReview: 'sheep' } },
      dateOfVisit: '2025-02-01',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-11-01',
            testResults: 'negative'
          }
        },
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2024-10-01',
            testResults: 'positive'
          }
        },
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-09-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe('negative')
  })

  test('getReviewTestResultWithinLast10Months should return testResults when an old world review within 10 months and the same species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'sheep',
      latestVetVisitApplication: {
        data: {
          whichReview: 'sheep',
          visitDate: '2024-09-01',
          testResults: 'positive'
        }
      },
      dateOfVisit: '2025-02-01',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2024-09-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe('positive')
  })

  test('getReviewTestResultWithinLast10Months should return undefined when an old world review outside 10 months and the same species', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'sheep',
      latestVetVisitApplication: {
        data: {
          whichReview: 'sheep',
          visitDate: '2023-09-01',
          testResults: 'positive'
        }
      },
      dateOfVisit: '2025-02-01',
      previousClaims: []
    })

    expect(getReviewTestResultWithinLast10Months()).toBe(undefined)
  })

  test('getReviewTestResultWithinLast10Months should return undefined when there are no previous claims', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'sheep',
      latestVetVisitApplication: undefined,
      dateOfVisit: '2025-02-01',
      previousClaims: undefined
    })

    expect(getReviewTestResultWithinLast10Months()).toBe(undefined)
  })

  test('getReviewTestResultWithinLast10Months should return only the claim associated with the same herdId found in the session', () => {
    getEndemicsClaim.mockReturnValueOnce({
      typeOfReview: 'E',
      typeOfLivestock: 'sheep',
      latestVetVisitApplication: { data: { whichReview: 'sheep' } },
      dateOfVisit: '2025-02-01',
      herdId: 'ABC123',
      previousClaims: [
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-11-01',
            testResults: 'negative'
          },
          herd: {
            id: 'ABC123'
          }
        },
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-12-15T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-12-01',
            testResults: 'positive'
          },
          herd: {
            id: 'XYZ999'
          }
        },
        {
          reference: 'AHWR-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 9,
          type: 'R',
          createdAt: '2024-09-01T10:25:11.318Z',
          data: {
            typeOfLivestock: 'sheep',
            dateOfVisit: '2024-11-01',
            testResults: 'positive'
          }
        }
      ]
    })

    expect(getReviewTestResultWithinLast10Months()).toBe('negative')
  })
})
