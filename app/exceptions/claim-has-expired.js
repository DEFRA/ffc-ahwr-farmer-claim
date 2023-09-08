class ClaimHasExpiredError extends Error {
  constructor (message, organisation, latestApplicationDate, claimExpiredDate) {
    super(message)
    this.name = 'ClaimHasExpired'
    this.organisation = organisation
    this.latestApplicationDate = latestApplicationDate
    this.claimExpiredDate = claimExpiredDate
  }
}

module.exports = ClaimHasExpiredError
