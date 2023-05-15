class InvalidPermissionsError extends Error {
  constructor (message) {
    super(message)
    this.name = 'InvalidPermissionsError'
  }
}

module.exports = InvalidPermissionsError
