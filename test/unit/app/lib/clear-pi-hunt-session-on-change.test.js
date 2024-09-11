const { clearPiHuntSessionOnChange } = require('../../../../app/lib/clear-pi-hunt-session-on-change')
const { setEndemicsClaim, getEndemicsClaim } = require('../../../../app/session')

jest.mock('../../../../app/session', () => ({
  setEndemicsClaim: jest.fn(),
  getEndemicsClaim: jest.fn()
}))

describe('clearPiHuntSessionOnChange', () => {
  let request

  beforeEach(() => {
    request = {}
    getEndemicsClaim.mockReturnValue({
      piHuntRecommended: 'yes',
      piHuntAllAnimals: 'yes',
      dateOfTesting: 'someDate',
      laboratoryURN: 'someURN',
      testResults: 'someResults'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should clear piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults for piHunt stage', () => {
    clearPiHuntSessionOnChange(request, 'piHunt')

    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'piHuntRecommended', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'piHuntAllAnimals', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'dateOfTesting', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'laboratoryURN', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'testResults', undefined)
  })

  it('should clear piHuntAllAnimals, dateOfTesting, laboratoryURN, and testResults for piHuntRecommended stage', () => {
    clearPiHuntSessionOnChange(request, 'piHuntRecommended')

    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'piHuntAllAnimals', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'dateOfTesting', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'laboratoryURN', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'testResults', undefined)
  })

  it('should clear dateOfTesting, laboratoryURN, and testResults for piHuntAllAnimals stage', () => {
    clearPiHuntSessionOnChange(request, 'piHuntAllAnimals')

    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'dateOfTesting', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'laboratoryURN', undefined)
    expect(setEndemicsClaim).toHaveBeenCalledWith(request, 'testResults', undefined)
  })
})
