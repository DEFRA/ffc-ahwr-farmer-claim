import {
  canChangeSpecies,
  getTypeOfLivestockFromLatestClaim,
  refreshApplications,
  refreshClaims
} from '../../../../app/lib/context-helper.js'
import { getClaimsByApplicationReference } from '../../../../app/api-requests/claim-service-api.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../app/session/index.js'
import { getAllApplicationsBySbi } from '../../../../app/api-requests/application-service-api.js'
import { isWithin10Months } from '../../../../app/lib/date-utils.js'

jest.mock('../../../../app/session/index')
jest.mock('../../../../app/api-requests/claim-service-api')
jest.mock('../../../../app/api-requests/application-service-api')
jest.mock('../../../../app/lib/date-utils')
describe('context-helper', () => {
  test('canChangeSpecies should return false when there are previous endemic (new-world) claims', () => {
    getEndemicsClaim.mockReturnValueOnce({
      previousClaims: [{ data: { typeOfReview: 'R' } }]
    })

    expect(canChangeSpecies({}, 'review')).toBe(false)
  })

  test('canChangeSpecies should return false when type of review is follow-up', () => {
    getEndemicsClaim.mockReturnValueOnce({
      previousClaims: []
    })

    expect(canChangeSpecies({}, 'endemics')).toBe(false)
  })

  test('canChangeSpecies should return true when there are no previous endemic (new-world) claims, and type of review is review', () => {
    getEndemicsClaim.mockReturnValueOnce({
      previousClaims: []
    })

    expect(canChangeSpecies({}, 'review')).toBe(true)
  })

  test('getTypeOfLivestockFromLatestClaim will return from latest endemics claim', () => {
    getEndemicsClaim.mockReturnValueOnce({
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
    getEndemicsClaim.mockReturnValueOnce({
      latestVetVisitApplication: {
        data: {
          whichReview: 'sheep'
        }
      }
    })

    expect(getTypeOfLivestockFromLatestClaim({})).toBe('sheep')
  })

  test('getTypeOfLivestockFromLatestClaim will return from latest endemics claim if both exist', () => {
    getEndemicsClaim.mockReturnValueOnce({
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
      ],
      latestVetVisitApplication: {
        data: {
          whichReview: 'dairy'
        }
      }
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
    const mockRequest = { logger: () => {} }
    getClaimsByApplicationReference.mockReturnValueOnce(mockClaims)

    const returnedClaims = await refreshClaims(mockRequest, 'anyOldRef')

    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'previousClaims', mockClaims)
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
    const mockRequest = { logger: () => {}, query: { sbi: '123' } }
    getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toBeUndefined()
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
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
    const mockRequest = { logger: () => {}, query: { sbi: '123' } }
    getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)
    isWithin10Months.mockReturnValueOnce(true)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toEqual({
      name: 'app2',
      type: 'VV'
    })
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
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
    const mockRequest = { logger: () => {}, query: { sbi: '123' } }
    getAllApplicationsBySbi.mockReturnValueOnce(mockApplications)
    isWithin10Months.mockReturnValueOnce(false)

    const returnedApplication = await refreshApplications(mockRequest)

    expect(returnedApplication.latestEndemicsApplication).toEqual({
      name: 'app1',
      type: 'EE'
    })
    expect(returnedApplication.latestVetVisitApplication).toBeUndefined()
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestEndemicsApplication', returnedApplication.latestEndemicsApplication)
    expect(setEndemicsClaim).toBeCalledWith(expect.anything(), 'latestVetVisitApplication', returnedApplication.latestVetVisitApplication)
  })
})
