const { canMakeReviewClaim, canMakeEndemicsClaim } = require('../../../../app/lib/can-make-claim')
const { READY_TO_PAY, PAID, REJECTED, ACCEPTED } = require('../../../../app/constants/status')

const createReviewClaim = (dateOfVisit, statusId = 9) => ({
  statusId,
  data: {
    dateOfVisit
  }
})

const organisation = {
  name: 'Best Farmers Co',
  sbi: '111222'
}

const formattedTypeOfLivestock = 'beef cattle'
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
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and the previous review claim has a status of ready to pay', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), READY_TO_PAY), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and does not have a previous endemics claim', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })

  test('should be able to make endemics claim when the previous review claim is within 10 months and the previous endemics claim is older than 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 1, 25), PAID), new Date(2023, 1, 25), organisation, formattedTypeOfLivestock)

    expect(result).toEqual('')
  })

  test('should not be able to make endemics claim when there is not a previous review claim', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), undefined, prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be no more than 10 months between your reviews and follow-ups.')
  })

  test('should not be able to make endemics claim when the previous review claim is older than 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2023, 3, 25)), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be no more than 10 months between your reviews and follow-ups.')
  })

  test('should not be able to make endemics claim when the previous review claim has a status of rejected', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), REJECTED), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('Best Farmers Co - SBI 111222 had a failed review claim for beef cattle in the last 10 months.')
  })

  test('should not be able to make endemics claim when the previous review claim does not have a status of ready to pay or paid', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), ACCEPTED), organisation, formattedTypeOfLivestock)

    expect(result).toEqual('Your review claim must have been approved before you claim for the follow-up that happened after it.')
  })

  test('should not be able to make endemics claim when the previous endemics claim is within 10 months', () => {
    const result = canMakeEndemicsClaim(new Date(2024, 3, 25), createReviewClaim(new Date(2024, 3, 25), PAID), new Date(2024, 1, 25), prevEndemicsClaimDate, organisation, formattedTypeOfLivestock)

    expect(result).toEqual('There must be at least 10 months between your follow-ups.')
  })
})
