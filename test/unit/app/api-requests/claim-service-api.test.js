const Wreck = require('@hapi/wreck')
const sessionMock = require('../../../../app/session')

const consoleErrorSpy = jest.spyOn(console, 'error')

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
      payload: 'payload'
    }
    Wreck.get.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.getClaimsByApplicationReference(
      'applicationReference'
    )

    expect(result).toBe('payload')
  })
  test('Get claims by application reference should return null with status 404', async () => {
    const mockResponse = {
      res: {
        statusCode: 404,
        statusMessage: 'not found'
      },
      payload: 'payload'
    }
    Wreck.get.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.getClaimsByApplicationReference(
      'applicationReference'
    )

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(result).toBe(null)
    expect(claimServiceApi.isWithin10Months(Date.now())).toBe(false)
  })
  test('Post claim should return status 200', async () => {
    const mockResponse = {
      res: {
        statusCode: 200,
        statusMessage: 'OK'
      },
      payload: 'new claim'
    }
    Wreck.post.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.submitNewClaim(
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
    Wreck.post.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.submitNewClaim(
      'new claim with invalid data'
    )

    expect(result).toBe(null)
    expect(claimServiceApi.isWithin10Months()).toBe(false)
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
    Wreck.post.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.isURNUnique({ sbi: '123456789', laboratoryURN: '1234567' })

    expect(result).toBe(payload)
  })
  test('Check if URN number is unique with wrong data', async () => {
    const mockResponse = {
      res: {
        statusCode: 400,
        statusMessage: 'Bad Request'
      }
    }
    Wreck.post.mockResolvedValue(mockResponse)

    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    const result = await claimServiceApi.isURNUnique('new claim with invalid data')

    expect(result).toBe(null)
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
    const claimServiceApi = require('../../../../app/api-requests/claim-service-api')
    sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'E', typeOfLivestock: 'beef', latestVetVisitApplication: { data: { whichReview: 'beef' } }, previousClaims: [{ data: { typeOfReview: 'R' } }] })

    expect(claimServiceApi.isFirstTimeEndemicClaimForActiveOldWorldReviewClaim()).toBe(true)
  })
})
