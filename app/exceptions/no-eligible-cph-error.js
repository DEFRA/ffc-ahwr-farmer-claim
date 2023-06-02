class NoEligibleCphError extends Error {
  constructor (message) {
    super(message)
    this.name = 'NoEligibleCph'
  }
}

module.exports = NoEligibleCphError
