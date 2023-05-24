class ClaimHasExpired extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'ClaimHasExpired'
    this.organisation = organisation
  }
}

module.exports = ClaimHasExpired
