class NoApplicationFound extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'NoAgreementFoundForThisBusiness'
    this.organisation = organisation
  }
}

module.exports = NoApplicationFound
