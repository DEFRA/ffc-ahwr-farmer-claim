class ClaimHasExpiredError extends Error {
  constructor (message, organisation, lastApplicationDate, claimExpiredDate) {
    super(message)
    this.name = 'ClaimHasExpired'
    this.organisation = organisation
    this.lastApplicationDate = lastApplicationDate
    this.claimExpiredDate = claimExpiredDate
  }
}

module.exports = ClaimHasExpiredError
