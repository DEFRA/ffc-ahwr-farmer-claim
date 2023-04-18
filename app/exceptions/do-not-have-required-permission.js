class DoNotHaveRequiredPermission extends Error {
  constructor (message) {
    super(message)
    this.name = 'DoNotHaveRequiredPermission'
  }
}

module.exports = DoNotHaveRequiredPermission
