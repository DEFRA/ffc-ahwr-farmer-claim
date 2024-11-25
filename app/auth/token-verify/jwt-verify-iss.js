const config = require('../../config')

const jwtTrustedIssuers = [
  `https://${config.authConfig.defraId.tenantName}.b2clogin.com/${config.authConfig.defraId.jwtIssuerId}/v2.0/`
]

const jwtVerifyIss = async (iss) => {
  if (!jwtTrustedIssuers.includes(iss)) {
    throw new Error(`Issuer not trusted: ${iss}`)
  }
  return true
}

module.exports = jwtVerifyIss
