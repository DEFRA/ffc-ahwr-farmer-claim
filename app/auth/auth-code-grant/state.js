const { v4: uuidv4 } = require('uuid')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const config = require('../../config')

const generate = (request) => {
  const state = {
    id: uuidv4(),
    namespace: config.namespace,
    source: 'claim'
  }

  const base64EncodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  session.setToken(request, tokens.state, base64EncodedState)
  return base64EncodedState
}

const verify = (request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      return false
    }
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
    const savedState = JSON.parse(Buffer.from(session.getToken(request, tokens.state), 'base64').toString('ascii'))
    return decodedState.id === savedState.id
  } else {
    console.log(`Error returned from authentication request ${request.query.error_description} for id ${request.yar.id}.`)
    return false
  }
}

module.exports = {
  generate,
  verify
}
