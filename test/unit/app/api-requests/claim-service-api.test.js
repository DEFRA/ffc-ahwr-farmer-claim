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

  test.each([
    {
      description: 'prior review claim difference is less than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'R',
        createdAt: '2023-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2023-02-19'
        }
      }]
    },
    {
      description: 'next review claim difference is less than 10 months',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'R',
        createdAt: '2023-07-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2023-08-19'
        }
      }]
    }])('isValidReviewDate when ($description)', async ({ dateOfVisit, claims }) => {
    const { isValidReviewDate } = require('../../../../app/api-requests/claim-service-api')
    const { isValid, content } = isValidReviewDate(claims, dateOfVisit)
    expect(isValid).toEqual(false)
    expect(content.url).toEqual('https://apply-for-an-annual-health-and-welfare-review.defra.gov.uk/apply/guidance-for-farmers')
  })

  test.each([
    {
      description: 'prior review claim difference is more than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'R',
        createdAt: '2022-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2022-02-19'
        }
      }]
    },
    {
      description: 'next review claim difference is more than 10 months',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'R',
        createdAt: '2024-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2024-02-03'
        }
      }]
    }
  ])('isValidReviewDate when ($description)', async ({ dateOfVisit, claims }) => {
    const { isValidReviewDate } = require('../../../../app/api-requests/claim-service-api')
    const { isValid, content } = isValidReviewDate(claims, dateOfVisit)
    expect(isValid).toEqual(true)
    expect(content.url).toBeUndefined()
  })

  test.each([
    {
      description: 'prior successful review claim difference is more than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 9,
        type: 'R',
        createdAt: '2022-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2022-02-19'
        }
      }],
      text: 'There must be no more than 10 months between your annual health and welfare reviews and endemic disease follow-ups.'
    },
    {
      description: 'prior failed review claim difference is more than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 10,
        type: 'R',
        createdAt: '2022-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2022-02-19'
        }
      }],
      text: 'The Dairy Farm - SBI 123456789 had a failed review claim for beef cattle in the last 10 months.'
    },
    {
      description: 'next endemics claim difference is less than 10 months',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'E',
        createdAt: '2023-07-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2023-08-19'
        }
      }],
      text: 'There must be at least 10 months between your endemics follow-ups.'
    }])('isValidEndemicsDate when ($description)', async ({ dateOfVisit, claims, text }) => {
    const { isValidEndemicsDate } = require('../../../../app/api-requests/claim-service-api')
    const { isValid, content } = isValidEndemicsDate(claims, dateOfVisit, { name: 'The Dairy Farm', sbi: '123456789' }, 'beef cattle')
    expect(isValid).toEqual(false)
    expect(content.text).toEqual(text)
  })

  test.each([
    {
      description: 'prior successful review claim difference is less than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 9,
        type: 'R',
        createdAt: '2022-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '202-11-02-19'
        }
      }]
    },
    {
      description: 'prior failed review claim difference is less than ten moth',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 10,
        type: 'R',
        createdAt: '2022-02-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2022-10-19'
        }
      }]
    },
    {
      description: 'next endemics claim difference is more than 10 months',
      dateOfVisit: new Date('2023-03-19'),
      claims: [{
        reference: 'AHWR-C2EA-C718',
        applicationReference: 'AHWR-2470-6BA9',
        statusId: 1,
        type: 'E',
        createdAt: '2023-07-19T10:25:11.318Z',
        data: {
          typeOfLivestock: 'beef',
          dateOfVisit: '2024-02-19'
        }
      }]
    }])('isValidEndemicsDate when ($description)', async ({ dateOfVisit, claims, text }) => {
    const { isValidEndemicsDate } = require('../../../../app/api-requests/claim-service-api')
    const { isValid } = isValidEndemicsDate(claims, dateOfVisit)
    expect(isValid).toEqual(true)
  })
})
