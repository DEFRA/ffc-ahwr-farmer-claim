const { canMakeReviewClaim, canMakeEndemicsClaim } = require('../../../../app/lib/can-make-claim')
const { READY_TO_PAY, PAID, REJECTED, ACCEPTED } = require('../../../../app/constants/status')

describe('claim-service-ms', () => {
  describe('canMakeReviewClaim', () => {
    describe('should be able to make review claim', () => {
      test('when there is not a previous review claim', () => {
        const result = canMakeReviewClaim(new Date(), undefined)

        expect(result).toEqual({ isValid: true, reason: '' })
      })

      test('when the previous review claim is older than 10 months', () => {
        const result = canMakeReviewClaim(new Date(2024, 3, 25), new Date(2023, 3, 25))

        expect(result).toEqual({ isValid: true, reason: '' })
      })
    })

    describe('should not be able to make review claim', () => {
      test('when the previous review claim is within 10 months ', () => {
        const result = canMakeReviewClaim(new Date(2024, 3, 25), new Date(2024, 1, 25))

        expect(result).toEqual({ isValid: false, reason: 'another review within 10 months' })
      })
    })
  })

  describe('canMakeEndemicsClaim', () => {
    const createReviewClaim = (dateOfVisit, statusId = 9) => ({
      statusId,
      data: {
        dateOfVisit
      }
    })

    describe('should be able to make endemics claim when the previous review claim is within 10 months', () => {
      test('and the previous review claim has a status of paid', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID))

        expect(result).toEqual({ isValid: true, reason: '' })
      })

      test('and the previous review claim has a status of ready to pay', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), READY_TO_PAY))

        expect(result).toEqual({ isValid: true, reason: '' })
      })

      test('and does not have a previous endemics claim', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID))

        expect(result).toEqual({ isValid: true, reason: '' })
      })

      test('and the previous endemics claim is older than 10 months', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID), new Date(2023, 1, 25))

        expect(result).toEqual({ isValid: true, reason: '' })
      })
    })

    describe('should not be able to make endemics claim', () => {
      test('when there is not a previous review claim', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), undefined)

        expect(result).toEqual({ isValid: false, reason: 'no review within 10 months past' })
      })

      test('when the previous review claim is older than 10 months', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2023, 3, 25)))

        expect(result).toEqual({ isValid: false, reason: 'no review within 10 months past' })
      })

      test('when the previous review claim has a status of rejected', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), REJECTED))

        expect(result).toEqual({ isValid: false, reason: 'rejected review' })
      })

      test('when the previous review claim does not have a status of ready to pay or paid', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), ACCEPTED))

        expect(result).toEqual({ isValid: false, reason: 'claim endemics before review status is ready to pay' })
      })

      test('when the previous endemics claim is within 10 months', () => {
        const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), PAID), new Date(2024, 1, 25))

        expect(result).toEqual({ isValid: false, reason: 'another endemics within 10 months' })
      })
    })
  })
})
