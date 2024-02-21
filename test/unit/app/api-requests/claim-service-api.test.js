const Wreck = require('@hapi/wreck')
const { READY_TO_PAY } = require('../../../../app/constants/status')
const { claimType } = require('../../../../app/constants/claim')

const consoleErrorSpy = jest.spyOn(console, 'error')

jest.mock('@hapi/wreck')

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
    expect(claimServiceApi.isWithInLastTenMonths(Date.now())).toBe(true)
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
    expect(claimServiceApi.isWithInLastTenMonths()).toBe(false)
  })

  test('getMostRecentReviewDate from previousClaims', async () => {
    const { getMostRecentReviewDate } = require('../../../../app/api-requests/claim-service-api')

    const previousClaims = [{
      statusId: READY_TO_PAY,
      data: {
        dateOfVisit: '2023-01-01'
      },
      type: claimType.review
    }]

    const latestVetVisitApplication = {
      statusId: READY_TO_PAY,
      data: {
        visitDate: '2023-01-10'
      }
    }
    const date = getMostRecentReviewDate(previousClaims, latestVetVisitApplication)
    expect(date).toEqual(new Date('2023-01-01'))
  })

  test('getMostRecentReviewDate from latestVetVisitApplication', async () => {
    const { getMostRecentReviewDate } = require('../../../../app/api-requests/claim-service-api')

    const previousClaims = []

    const latestVetVisitApplication = {
      statusId: READY_TO_PAY,
      data: {
        visitDate: '2023-01-10'
      }
    }
    const date = getMostRecentReviewDate(previousClaims, latestVetVisitApplication)
    expect(date).toEqual(new Date('2023-01-10'))
  })

  test('getMostRecentReviewDate return undefined if no previous review date', async () => {
    const { getMostRecentReviewDate } = require('../../../../app/api-requests/claim-service-api')

    const previousClaims = []
    const latestVetVisitApplication = undefined

    const date = getMostRecentReviewDate(previousClaims, latestVetVisitApplication)
    expect(date).toEqual(undefined)
  })
})
