class InvalidStateError extends Error {
  constructor (message) {
    super(message)
    this.name = 'InvalidStateError'
  }
}

module.exports = InvalidStateError
