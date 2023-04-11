class NoAgreementFoundForThisBusiness extends Error {
  constructor (message) {
    super(message)
    this.name = 'NoAgreementFoundForThisBusiness'
  }
}

module.exports = NoAgreementFoundForThisBusiness
