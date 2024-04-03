const Wreck = require('@hapi/wreck')
const { READY_TO_PAY } = require('../../../../app/constants/status')
const { claimType } = require('../../../../app/constants/claim')

const consoleErrorSpy = jest.spyOn(console, 'error')

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
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
})
