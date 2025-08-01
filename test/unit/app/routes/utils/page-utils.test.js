import { config } from '../../../../../app/config/index.js'
import { getEndemicsClaimDetails, prefixUrl } from '../../../../../app/routes/utils/page-utils.js'
import { claimConstants } from '../../../../../app/constants/claim.js'

describe('prefixUrl', () => {
  beforeEach(() => {
    config.urlPrefix = '/claim'
  })

  test('should prefix the URL with the configured prefix', () => {
    const specificUrl = 'details'
    const result = prefixUrl(specificUrl)
    expect(result).toBe('/claim/details')
  })
})

describe('getEndemicsClaimDetails', () => {
  test('should get the details of endemics claim', () => {
    const typeOfLivestock = 'beef'
    const typeOfReview = claimConstants.claimType.endemics
    const result = getEndemicsClaimDetails(typeOfLivestock, typeOfReview)

    expect(result.isBeef).toBe(true)
    expect(result.isDairy).toBe(false)
    expect(result.isPigs).toBe(false)
    expect(result.isSheep).toBe(false)
    expect(result.isEndemicsFollowUp).toBe(true)
    expect(result.isBeefOrDairyEndemics).toBe(true)
    expect(result.isReview).toBe(false)
  })
})