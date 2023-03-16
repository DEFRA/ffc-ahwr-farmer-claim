const crypto = require('crypto')
const { pkcecodes } = require('../session/keys')

const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const createCryptoProvider = (session, request) => {
  const verifier = base64URLEncode(crypto.randomBytes(32))
  const challenge = base64URLEncode(sha256(verifier))
  session.setPkcecodes(request, pkcecodes.verifier, verifier)
  return challenge
}

const sha256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest()
}

module.exports = {
  createCryptoProvider
}
