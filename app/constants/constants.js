export const apiHeaders = {
  xForwardedAuthorization: 'X-Forwarded-Authorization',
  ocpSubscriptionKey: 'Ocp-Apim-Subscription-Key'
}

export const farmerClaim = 'farmerClaim'

export const status = {
  AGREED: 1,
  WITHDRAWN: 2,
  IN_CHECK: 5,
  ACCEPTED: 6,
  NOT_AGREED: 7,
  PAID: 8,
  READY_TO_PAY: 9,
  REJECTED: 10,
  ON_HOLD: 11
}

export const MULTIPLE_SPECIES_RELEASE_DATE = new Date('2025-02-26T00:00:00') // 26th Feb 2025

export const DAIRY_FOLLOW_UP_RELEASE_DATE = new Date('2025-01-21T00:00:00') // 21st Jan 2025
