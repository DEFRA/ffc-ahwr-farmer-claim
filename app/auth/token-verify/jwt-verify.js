const jwt = require('jsonwebtoken')
const jwktopem = require('jwk-to-pem')
const acquireSigningKey = require('./acquire-signing-key')

const jwtVerify = async (token) => {
  const jwk = await acquireSigningKey()
  const publicKey = jwktopem(jwk)
  const decoded = await jwt.verify(token, publicKey, { algorithms: ['RS256'], ignoreNotBefore: true })
  if (!decoded) {
    throw new Error('The token has not been verified')
  }
}

module.exports = jwtVerify
