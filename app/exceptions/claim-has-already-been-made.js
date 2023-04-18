class ClaimHasAlreadyBeenMade extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'ClaimHasAlreadyBeenMade'
    this.organisation = organisation
  }
}

module.exports = ClaimHasAlreadyBeenMade
