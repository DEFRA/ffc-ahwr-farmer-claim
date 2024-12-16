const { getAssessmentPercentageErrorMessage } = require('../../../../../app/routes/endemics/biosecurity')

describe('biosecurity', () => {
  describe('getAssessmentPercentageErrorMessage', () => {
    it('returns undefined when biosecurity is undefined', () => {
      expect(getAssessmentPercentageErrorMessage(undefined, undefined)).toBeUndefined()
    })

    it('returns "Enter the assessment percentage" when the assessment percentage is an empty string', () => {
      expect(getAssessmentPercentageErrorMessage({}, '')).toEqual('Enter the assessment percentage')
    })

    it('returns "The assessment percentage must be a number between 1 and 100" when the assessment percentage a number less than 1', () => {
      expect(getAssessmentPercentageErrorMessage({}, 0.2)).toEqual('The assessment percentage must be a number between 1 and 100')
    })

    it('returns "The assessment percentage must be a number between 1 and 100" when the assessment percentage a number more than 100', () => {
      expect(getAssessmentPercentageErrorMessage({}, 220)).toEqual('The assessment percentage must be a number between 1 and 100')
    })

    it('returns "The assessment percentage can only include numbers" when the assessment percentage is not a number', () => {
      expect(getAssessmentPercentageErrorMessage({}, '100')).toEqual('The assessment percentage can only include numbers')
    })
  })
})
