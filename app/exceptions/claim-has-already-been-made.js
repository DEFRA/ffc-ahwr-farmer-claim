class ClaimHasAlreadyBeenMade extends Error {
  constructor (message) {
    super(message)
    this.name = 'ClaimHasAlreadyBeenMade'
  }
}

module.exports = ClaimHasAlreadyBeenMade
