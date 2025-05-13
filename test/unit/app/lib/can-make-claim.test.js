import { canMakeClaim, canMakeEndemicsClaim, canMakeReviewClaim } from '../../../../app/lib/can-make-claim.js'
import { claimConstants } from '../../../../app/constants/claim.js'
import { status } from '../../../../app/constants/constants.js'
const { review, endemics } = claimConstants.claimType

const { READY_TO_PAY, PAID, REJECTED, ACCEPTED } = status

const createClaim = (type, dateOfVisit, statusId = READY_TO_PAY) => ({
  type,
  statusId,
  data: {
    dateOfVisit
  }
})

const organisation = {
  name: 'Best Farmers Co',
  sbi: '111222'
}

const typeOfLivestock = 'beef'
const prevEndemicsClaimDate = new Date(2024, 1, 2)

describe('canMakeReviewClaim', () => {
  test('should be able to make review claim when there is not a previous review claim', () => {
    const result = canMakeReviewClaim(new Date(), undefined)

    expect(result).toEqual('')
  })

  test('should be able to make review claim when the previous review claim is older than 10 months', () => {
    const result = canMakeReviewClaim(new Date(2024, 3, 25), new Date(2023, 3, 25))

    expect(result).toEqual('')
  })

  test('should not be able to make review claim when the previous review claim is within 10 months ', () => {
    const result = canMakeReviewClaim(new Date(2024, 3, 25), new Date(2024, 1, 25))

    expect(result).toEqual('There must be at least 10 months between your reviews.')
  })
})

describe('canMakeEndemicsClaim', () => {
  test('should be able to make endemics claim when the previous review claim is within 10 months and the previous review claim has a status of paid', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 1, 25), PAID), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and the previous review claim has a status of ready to pay', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 1, 25), READY_TO_PAY), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and does not have a previous endemics claim', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 1, 25), PAID), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and the previous endemics claim is older than 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 1, 25), PAID), new Date(2023, 1, 25), organisation, typeOfLivestock)

    expect(result).toEqual('')
  })

  test('should not be able to make endemics claim when the previous review claim is older than 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2023, 3, 25)), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('There must be no more than 10 months between your reviews and follow-ups.')
  })

  test('should not be able to make endemics claim when the previous review claim has a status of rejected', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 3, 25), REJECTED), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('Best Farmers Co - SBI 111222 had a failed review claim for beef cattle in the last 10 months.')
  })

  test('should not be able to make endemics claim when the previous review claim does not have a status of ready to pay or paid', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 3, 25), ACCEPTED), organisation, typeOfLivestock)

    expect(result).toEqual('Your review claim must have been approved before you claim for the follow-up that happened after it.')
  })

  test('should not be able to make endemics claim when the previous endemics claim is within 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createClaim(review, new Date(2024, 3, 25), PAID), new Date(2024, 1, 25), prevEndemicsClaimDate, organisation, typeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })
})

describe('canMakeClaim', () => {
  test('should validate review claim if typeOfReview is review', () => {
    const result = canMakeClaim({
      prevClaims: [createClaim(new Date(2023, 3, 25))],
      typeOfReview: review,
      dateOfVisit: new Date(2024, 3, 25),
      organisation: {},
      typeOfLivestock: 'beef',
      oldWorldApplication: undefined
    })

    expect(result).toEqual('')
  })

  test('should validate endemics claim if typeOfReview is endemics', () => {
    const prevReviewClaim = createClaim(review, new Date(2024, 1, 25), PAID)
    const prevEndemicsClaim = createClaim(endemics, new Date(2024, 1, 25))

    const result = canMakeClaim({
      prevClaims: [prevReviewClaim, prevEndemicsClaim],
      typeOfReview: endemics,
      dateOfVisit: new Date(2024, 3, 25),
      organisation,
      typeOfLivestock: 'beef',
      oldWorldApplication: undefined
    })

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should use old world claim if no previous review claim exists', () => {
    const oldWorldApplication = {
      reference: 'AHWR-2470-6BA9',
      dateOfVisit: new Date(2023, 9, 25),
      data: {
        visitDate: '2023-01-01',
        whichReview: 'beef'
      },
      statusId: 1,
      type: 'VV'
    }

    const result = canMakeClaim({
      prevClaims: [],
      typeOfReview: endemics,
      dateOfVisit: new Date(2024, 3, 25),
      organisation,
      typeOfLivestock: 'beef',
      oldWorldApplication
    })

    expect(result).toEqual('There must be no more than 10 months between your reviews and follow-ups.')
  })
})
