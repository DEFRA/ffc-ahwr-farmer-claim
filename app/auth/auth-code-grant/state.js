const { v4: uuidv4 } = require('uuid')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const InvalidStateError = require('./invalid-state-error')

const generate = (request) => {
  const state = uuidv4()
  session.setToken(request, tokens.state, state)
  return state
}

const verify = (request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      throw new InvalidStateError('No state found in request.query')
    }
    const savedState = session.getToken(request, tokens.state)
    return state === savedState
  } else {
    throw new InvalidStateError(`Error returned from authentication request ${request.query.error_description} for id ${request.yar.id}.`)
  }
}

module.exports = {
  generate,
  verify
}
