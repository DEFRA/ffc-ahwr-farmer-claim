import wreck from '@hapi/wreck'
import {
  getAmount,
  getClaimsByApplicationReference,
  isCattleEndemicsClaimForOldWorldReview,
  isURNUnique,
  submitNewClaim
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

  test('Check if the date is with in 8 months', async () => {
    const { isWithIn4MonthsBeforeOrAfterDateOfVisit } = require('../../../../app/api-requests/claim-service-api')

    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-06-23'))).toBe(true)
    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-08-23'))).toBe(true)
    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-08-24'))).toBe(false)
    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2023-12-23'))).toBe(true)
    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2023-12-22'))).toBe(false)
    expect(isWithIn4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-10-23'))).toBe(false)
  })

  test('Check if the date of testing is less than date of visit', async () => {
    const { isDateOfTestingLessThanDateOfVisit } = require('../../../../app/api-requests/claim-service-api')

    expect(isDateOfTestingLessThanDateOfVisit('2024-04-23', '2024-06-23')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-05-10', '2024-08-23')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-07-23', '2024-08-24')).toBe(false)
    expect(isDateOfTestingLessThanDateOfVisit('2024-09-23', '2024-06-23')).toBe(true)
    expect(isDateOfTestingLessThanDateOfVisit('2024-10-04', '2023-10-23')).toBe(true)
  })

  test('Check if date of visit is valid for when type of review is not review or endemics', async () => {
    const { isValidDateOfVisit } = require('../../../../app/api-requests/claim-service-api')

    expect(isValidDateOfVisit('T')).toMatchObject({ isValid: false })
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
})
