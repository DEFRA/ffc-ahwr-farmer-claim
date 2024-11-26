const { v4: uuidv4 } = require('uuid')
const session = require('../../session')
const sessionKeys = require('../../session/keys')

const generate = (request) => {
  const nonce = uuidv4()
  session.setToken(request, sessionKeys.tokens.nonce, nonce)
  return nonce
}

const verify = (request, idToken) => {
  if (typeof idToken === 'undefined') {
    throw new Error('Empty id_token')
  }
  const nonce = session.getToken(request, sessionKeys.tokens.nonce)
  if (!nonce) {
    throw new Error('HTTP Session contains no nonce')
  }
  if (nonce !== idToken.nonce) {
    throw new Error('Nonce mismatch')
  }
}

module.exports = {
  generate,
  verify
}
