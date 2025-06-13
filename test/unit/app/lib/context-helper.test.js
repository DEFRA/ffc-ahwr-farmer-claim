import {
  canChangeSpecies,
  getTypeOfLivestockFromLatestClaim,
  refreshApplications,
  refreshClaims,
  isVisitDateAfterPIHuntAndDairyGoLive,
  skipSameHerdPage,
  skipOtherHerdsOnSbiPage,
  isMultipleHerdsUserJourney,
  getReviewHerdId
} from '../../../../app/lib/context-helper.js'
import { config } from '../../../../app/config/index.js'
import { getClaimsByApplicationReference } from '../../../../app/api-requests/claim-service-api.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../app/session/index.js'
import { getAllApplicationsBySbi } from '../../../../app/api-requests/application-service-api.js'
import { isWithin10Months } from '../../../../app/lib/date-utils.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE, ONLY_HERD } from '../../../../app/constants/constants.js'

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

  test('isVisitDateAfterPIHuntAndDairyGoLive throws error when no visit date provided', () => {
    expect(() => { isVisitDateAfterPIHuntAndDairyGoLive(undefined) }).toThrow('dateOfVisit must be parsable as a date, value provided: undefined')
  })
  test('isVisitDateAfterPIHuntAndDairyGoLive throws error when visit date provided is not parsable as a date', () => {
    expect(() => { isVisitDateAfterPIHuntAndDairyGoLive('abc123') }).toThrow('dateOfVisit must be parsable as a date, value provided: abc123')
  })
  test('isVisitDateAfterPIHuntAndDairyGoLive returns false when feature enabled but visit date pre go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() - 1)
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayBeforeGoLive.toISOString())).toBe(false)
  })
  test('isVisitDateAfterPIHuntAndDairyGoLive returns true when visit date post go live and value provided is a string', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toISOString()
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayOfGoLive)).toBe(true)
  })
  test('isVisitDateAfterPIHuntAndDairyGoLive returns true when visit date post go live and value provided is a date', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayOfGoLive)).toBe(true)
  })

  test('skipSameHerdPage, skip when no claims for any species', () => {
    const previousClaims = []

    expect(skipSameHerdPage(previousClaims, 'sheep')).toBe(true)
  })

  test('skipSameHerdPage, skip when no claims for species but do have claims for other species', () => {
    const previousClaims = [
      { createdAt: '2025-04-30T00:00:00.000Z', data: { typeOfLivestock: 'pigs' } },
      { createdAt: '2025-05-01T00:00:00.000Z', data: { typeOfLivestock: 'beef', herdId: '1' } },
      { createdAt: '2025-05-02T00:00:00.000Z', data: { typeOfLivestock: 'pigs', herdId: '2' } },
      { createdAt: '2025-05-03T00:00:00.000Z', data: { typeOfLivestock: 'dairy', herdId: '3' } }
    ]

    expect(skipSameHerdPage(previousClaims, 'sheep')).toBe(true)
  })

  test('skipSameHerdPage, skip when claims for species but one had herd', () => {
    const previousClaims = [
      { createdAt: '2025-05-01T00:00:00.000Z', data: { typeOfLivestock: 'sheep' } },
      { createdAt: '2025-05-02T00:00:00.000Z', data: { typeOfLivestock: 'sheep', herdId: '1' } }
    ]

    expect(skipSameHerdPage(previousClaims, 'sheep')).toBe(true)
  })

  test('skipOtherHerdsOnSbiPage, do not skip when existing herds undefined', () => {
    const randomlyGeneratedId = '8c726c7f-ceac-4253-8155-0fa5c868fbde'
    const existingHerds = undefined

    expect(skipOtherHerdsOnSbiPage(existingHerds, randomlyGeneratedId)).toBe(false)
  })
  test('skipOtherHerdsOnSbiPage, do not skip when existing herds empty', () => {
    const randomlyGeneratedId = '8c726c7f-ceac-4253-8155-0fa5c868fbde'
    const existingHerds = []

    expect(skipOtherHerdsOnSbiPage(existingHerds, randomlyGeneratedId)).toBe(false)
  })
  test('skipOtherHerdsOnSbiPage, skip when not using an existing herd', () => {
    const randomlyGeneratedId = '8c726c7f-ceac-4253-8155-0fa5c868fbde'
    const existingHerds = [{ herdId: '97ae1e8e-f8cd-44e0-bd61-d3469ae322c5', herdReasons: [ONLY_HERD] }]

    expect(skipOtherHerdsOnSbiPage(existingHerds, randomlyGeneratedId)).toBe(true)
  })
  test(`skipOtherHerdsOnSbiPage, skip when existing herd but reason not ${ONLY_HERD}`, () => {
    const existingHerdId = '8c726c7f-ceac-4253-8155-0fa5c868fbde'
    const existingHerds = [{ herdId: existingHerdId, herdReasons: ['foo'] }]

    expect(skipOtherHerdsOnSbiPage(existingHerds, existingHerdId)).toBe(true)
  })
  test(`skipOtherHerdsOnSbiPage, do not skip when existing herd and reason is ${ONLY_HERD}`, () => {
    const existingHerdId = '8c726c7f-ceac-4253-8155-0fa5c868fbde'
    const existingHerds = [{ herdId: existingHerdId, herdReasons: [ONLY_HERD] }]

    expect(skipOtherHerdsOnSbiPage(existingHerds, existingHerdId)).toBe(false)
  })

  test('skipSameHerdPage, don\'t skip when claims for species and none had herd', () => {
    const previousClaims = [
      { createdAt: '2025-05-01T00:00:00.000Z', data: { typeOfLivestock: 'sheep' } },
      { createdAt: '2025-05-02T00:00:00.000Z', data: { typeOfLivestock: 'sheep' } }
    ]

    expect(skipSameHerdPage(previousClaims, 'sheep')).toBe(false)
  })

  test('isMultipleHerdsUserJourney, returns false when feature disabled', () => {
    config.multiHerds.enabled = false

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns false when visit date before golive', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-04-30T00:00:00.000Z', [])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns false when reject T&Cs flag', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [{ appliesToMh: false }, { appliesToMh: true }])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns true when feature enabled, visit date on/after golive and no flags', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [])).toBe(true)
  })
  test('isMultipleHerdsUserJourney, returns true when feature enabled, visit date on/after golive and no reject T&Cs flag', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [{ appliesToMh: false }])).toBe(true)
  })

  describe('getReviewHerdId', () => {
    it('returns herdId when it is not equal to unnamedHerdId or tempHerdId', () => {
      const result = getReviewHerdId({
        herdId: 'abc123',
        tempHerdId: 'temp456',
        unnamedHerdId: 'unnamed789'
      })
      expect(result).toBe('abc123')
    })

    it('returns undefined when herdId equals tempHerdId', () => {
      const result = getReviewHerdId({
        herdId: 'temp456',
        tempHerdId: 'temp456',
        unnamedHerdId: 'unnamed789'
      })
      expect(result).toBeUndefined()
    })

    it('returns undefined when herdId equals unnamedHerdId', () => {
      const result = getReviewHerdId({
        herdId: 'unnamed789',
        tempHerdId: 'temp456',
        unnamedHerdId: 'unnamed789'
      })
      expect(result).toBeUndefined()
    })
  })
})
