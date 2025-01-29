const mockSession = require('../../../../app/session/index')
const mockClaimApi = require('../../../../app/api-requests/claim-service-api')
const mockApplicationApi = require('../../../../app/api-requests/application-service-api')
const mockDateUtils = require('../../../../app/lib/date-utils')
const { canChangeSpecies, getTypeOfLivestockFromLatestClaim, refreshClaims, refreshApplications } = require('../../../../app/lib/context-helper')
jest.mock('../../../../app/session/index')
jest.mock('../../../../app/api-requests/claim-service-api')
jest.mock('../../../../app/api-requests/application-service-api')
jest.mock('../../../../app/lib/date-utils')
describe('context-helper', () => {
  test('canChangeSpecies should return false when there are previous endemic (new-world) claims', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      previousClaims: [{ data: { typeOfReview: 'R' } }]
    })

    expect(canChangeSpecies({}, 'review')).toBe(false)
  })

  test('canChangeSpecies should return false when type of review is follow-up', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      previousClaims: []
    })

    expect(canChangeSpecies({}, 'endemics')).toBe(false)
  })

  test('canChangeSpecies should return true when there are no previous endemic (new-world) claims, and type of review is review', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      previousClaims: []
    })

    expect(canChangeSpecies({}, 'review')).toBe(true)
  })

  test('getTypeOfLivestockFromLatestClaim will return from latest endemics claim', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      previousClaims: [
        {
          data: {
            typeOfLivestock: 'sheep'
          }
        },
        {
          data: {
            typeOfLivestock: 'pigs'
          }
        }
      ]
    })

    expect(getTypeOfLivestockFromLatestClaim({})).toBe('sheep')
  })

  test('getTypeOfLivestockFromLatestClaim will return from latest application', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      latestVetVisitApplication: {
        data: {
          whichReview: 'sheep'
        }
      }
    })

    expect(getTypeOfLivestockFromLatestClaim({})).toBe('sheep')
  })

  test('getTypeOfLivestockFromLatestClaim will return from latest endemics claim if both exist', () => {
    mockSession.getEndemicsClaim.mockReturnValueOnce({
      latestVetVisitApplication: {
        data: {
          whichReview: 'dairy'
        }
      },
      previousClaims: [
        {
          data: {
            typeOfLivestock: 'sheep'
          }
        },
        {
          data: {
            typeOfLivestock: 'pigs'
          }
        }
      ]
    })

    expect(getTypeOfLivestockFromLatestClaim({})).toBe('sheep')
  })

  test('refreshClaims sets claims returned by API into the session and returns to caller', async () => {
    const mockClaims = [
      {
        name: 'claim1'
      },
      {
        name: 'claim2'
      }
    ]
    const mockRequest = { logger: () => { } }
    mockClaimApi.getClaimsByApplicationReference.mockReturnValueOnce(mockClaims)

    const returnedClaims = await refreshClaims(mockRequest, 'anyOldRef')

    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'previousClaims', mockClaims)
    expect(returnedClaims).toHaveLength(2)
  })

  test('refreshApplications sets latest new world application into the session and returns it', async () => {
    const mockApplications = [
      {
        name: 'app1',
        type: 'EE'
      },
      {
        name: 'app2',
        type: 'EE'
      }
    ]
    const mockRequest = { logger: () => { }, query: { sbi: '123' } }
    mockApplicationApi.getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toBeUndefined()
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
  })

  test('refreshApplications sets latest old world application into the session and returns it if within 10 months of latest new world one', async () => {
    const mockApplications = [
      {
        name: 'app1',
        type: 'EE'
      },
      {
        name: 'app2',
        type: 'VV'
      }
    ]
    const mockRequest = { logger: () => { }, query: { sbi: '123' } }
    mockApplicationApi.getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)
    mockDateUtils.isWithin10Months.mockReturnValueOnce(true)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toEqual({
      name: 'app2',
      type: 'VV'
    })
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
  })

  test('refreshApplications does not set latest old world application into the session or return it if not within 10 months of latest new world one', async () => {
    const mockApplications = [
      {
        name: 'app1',
        type: 'EE'
      },
      {
        name: 'app2',
        type: 'VV'
      }
    ]
    const mockRequest = { logger: () => { }, query: { sbi: '123' } }
    mockApplicationApi.getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)
    mockDateUtils.isWithin10Months.mockReturnValueOnce(false)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toBeUndefined()
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(mockSession.setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
  })
})
