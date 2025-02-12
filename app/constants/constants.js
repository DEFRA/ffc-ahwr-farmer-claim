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

export const openStatuses = [
  status.AGREED,
  status.IN_CHECK,
  status.ACCEPTED,
  status.ON_HOLD
]
