const { v4: uuidv4 } = require('uuid')
const session = require('../../session')
const { tokens } = require('../../session/keys')

const generate = (request) => {
  const state = uuidv4()
  session.setToken(request, tokens.state, state)
  return state
}

const verify = (request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      return false
    }
    const savedState = session.getToken(request, tokens.state)
    return state === savedState
  } else {
    console.log(`Error returned from authentication request ${request.query.error_description} for id ${request.yar.id}.`)
    return false
  }
}

module.exports = {
  generate,
  verify
}
