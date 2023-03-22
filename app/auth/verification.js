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

const stateIsValid = (session, request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      return false
    }
    const savedState = session?.getToken(request, tokens.state)
    return state === savedState
  } else {
    console.log(`Error returned from authentication request ${request.query.error_description} for id ${request.yar.id}.`)
    return false
  }
}

module.exports = {
  generateNonce,
  generateState,
  stateIsValid
}
