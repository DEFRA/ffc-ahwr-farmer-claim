import { getReviewType } from '../../../../app/lib/get-review-type.js'
import { claimConstants } from '../../../../app/constants/claim.js'

const { claimType } = claimConstants

describe('getReviewType', () => {
  let typeOfReview
  test('returns correct value for Review claim type', () => {
    typeOfReview = claimType.review
    const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

    expect(isReview).toBe(true)
    expect(isEndemicsFollowUp).toBe(false)
  })

  test('returns correct value for Endemics Follow-up clam type', () => {
    typeOfReview = claimType.endemics
    const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

    expect(isReview).toBe(false)
    expect(isEndemicsFollowUp).toBe(true)
  })
})
