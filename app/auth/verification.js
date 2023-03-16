const { v4: uuidv4 } = require('uuid')
const { tokens } = require('../session/keys')

const generateNonce = (session, request) => {
  const nonce = uuidv4()
  session.setToken(request, tokens.nonce, nonce)
  return nonce
}

const generateState = (session, request) => {
  const state = uuidv4()
  session.setToken(request, tokens.state, state)
  return state
}

module.exports = {
  generateNonce,
  generateState
}
