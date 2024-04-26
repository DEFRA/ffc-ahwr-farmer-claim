const status = {
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

const openStatuses = [
  status.AGREED,
  status.IN_CHECK,
  status.ACCEPTED,
  status.ON_HOLD
]

const closedStatuses = [
  status.WITHDRAWN,
  status.NOT_AGREED,
  status.READY_TO_PAY,
  status.REJECTED
]

const successfulStatuses = [
  status.WITHDRAWN,
  status.NOT_AGREED,
  status.READY_TO_PAY
]

const statusesFor10MonthCheck = [
  ...openStatuses,
  status.READY_TO_PAY,
  status.REJECTED
]

const validReviewStatuses = [
  ...openStatuses,
  status.READY_TO_PAY
]

module.exports = { ...status, openStatuses, closedStatuses, successfulStatuses, statusesFor10MonthCheck, validReviewStatuses }
