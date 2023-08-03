class NoApplicationFound extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'NoApplicationFound'
    this.organisation = organisation
  }
}

module.exports = NoApplicationFound
