class NoAgreementForThisBusiness extends Error {
  constructor (message) {
    super(message)
    this.name = 'NoAgreementForThisBusiness'
  }
}

module.exports = NoAgreementForThisBusiness
