import { getReviewWithinLast10Months } from '../../../../app/api-requests/claim-service-api.js'
import { config } from '../../../../app/config/index.js'
import routes from '../../../../app/config/routes'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../app/lib/context-helper.js'
import { getNextMultipleHerdsPage } from '../../../../app/lib/get-next-multiple-herds-page'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../app/session'
import { sessionKeys } from '../../../../app/session/keys'

jest.mock('../../../../app/session')
jest.mock('../../../../app/api-requests/claim-service-api.js')
jest.mock('../../../../app/lib/context-helper.js', () => {
  const actual = jest.requireActual('../../../../app/lib/context-helper.js')
  return {
    ...actual,
    isVisitDateAfterPIHuntAndDairyGoLive: jest.fn()
  }
})

describe('getNextMultipleHerdsPage', () => {
  const mockRequest = {}

  const { endemicsDateOfTesting, endemicsSpeciesNumbers } = routes
  const {
    endemicsClaim: {
      reviewTestResults: reviewTestResultsKey,
      relevantReviewForEndemics: relevantReviewForEndemicsKey
    }
  } = sessionKeys

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns endemicsDateOfTesting route when review', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'sheep',
      dateOfVisit: '2024-06-01',
      herdId: 'herd123',
      tempHerdId: 'temp',
      unnamedHerdId: 'unnamed'
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(result).toBe(`${config.urlPrefix}/${endemicsDateOfTesting}`)
  })

  test('returns endemicsDateOfTesting route when follow up and sheep', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'sheep',
      dateOfVisit: '2024-06-01',
      herdId: 'herd123',
      tempHerdId: 'temp',
      unnamedHerdId: 'unnamed'
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(result).toBe(`${config.urlPrefix}/${endemicsDateOfTesting}`)
  })

  test('returns endemicsDateOfTesting route when follow-up and pigs', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'pigs',
      dateOfVisit: '2024-06-01',
      herdId: 'herd123',
      tempHerdId: 'temp',
      unnamedHerdId: 'unnamed'
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(result).toBe(`${config.urlPrefix}/${endemicsDateOfTesting}`)
  })

  test('returns endemicsSpeciesNumbers route when cows and test result is negative', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'beef',
      dateOfVisit: '2024-06-01',
      herdId: 'herd456',
      tempHerdId: 'temp',
      unnamedHerdId: 'unnamed'
    })
    isVisitDateAfterPIHuntAndDairyGoLive.mockReturnValue(false)
    getReviewWithinLast10Months.mockReturnValue({
      data: {
        testResults: 'negative'
      }
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(setEndemicsClaim).toHaveBeenCalledWith(
      mockRequest,
      relevantReviewForEndemicsKey,
      {
        data: {
          testResults: 'negative'
        }
      }
    )
    expect(setEndemicsClaim).toHaveBeenCalledWith(
      mockRequest,
      reviewTestResultsKey,
      'negative'
    )
    expect(result).toBe(`${config.urlPrefix}/${endemicsSpeciesNumbers}`)
    expect(getReviewWithinLast10Months).toHaveBeenCalledWith('2024-06-01', [], {}, 'beef', 'herd456')
  })

  test('returns endemicsSpeciesNumbers route when cows and pi hunt is enabled and visit date after go live', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'beef',
      dateOfVisit: '2024-06-01',
      herdId: 'herd456',
      tempHerdId: 'temp',
      unnamedHerdId: 'unnamed'
    })
    isVisitDateAfterPIHuntAndDairyGoLive.mockReturnValue(true)
    getReviewWithinLast10Months.mockReturnValue({
      data: {
        testResults: 'positive'
      }
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(setEndemicsClaim).toHaveBeenCalledWith(
      mockRequest,
      relevantReviewForEndemicsKey,
      {
        data: {
          testResults: 'positive'
        }
      }
    )
    expect(setEndemicsClaim).toHaveBeenCalledWith(
      mockRequest,
      reviewTestResultsKey,
      'positive'
    )
    expect(result).toBe(`${config.urlPrefix}/${endemicsSpeciesNumbers}`)
  })

  test('returns endemicsDateOfTesting route when follow up and sheep and herd is unnamed', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'sheep',
      dateOfVisit: '2024-06-01',
      herdId: 'herd123',
      tempHerdId: 'temp',
      unnamedHerdId: 'herd123'
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(result).toBe(`${config.urlPrefix}/${endemicsDateOfTesting}`)
    expect(getReviewWithinLast10Months).toHaveBeenCalledWith('2024-06-01', [], {}, 'sheep', undefined)
  })

  test('returns endemicsDateOfTesting route when follow up and sheep and herd is tempHerdId', () => {
    getEndemicsClaim.mockReturnValue({
      typeOfReview: 'E',
      previousClaims: [],
      latestVetVisitApplication: {},
      typeOfLivestock: 'sheep',
      dateOfVisit: '2024-06-01',
      herdId: 'herd123',
      tempHerdId: 'herd123',
      unnamedHerdId: 'unnamed'
    })

    const result = getNextMultipleHerdsPage(mockRequest)

    expect(result).toBe(`${config.urlPrefix}/${endemicsDateOfTesting}`)
    expect(getReviewWithinLast10Months).toHaveBeenCalledWith('2024-06-01', [], {}, 'sheep', undefined)
  })
})
