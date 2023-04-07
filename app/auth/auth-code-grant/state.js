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
  if (request.query.error) {
    throw new Error(`Error returned from authentication request ${request.query.error_description} for id ${request.yar.id}.`)
  }
  try {
    const state = request.query.state
    if (!state) {
      throw new InvalidStateError(`No state found: ${JSON.stringify({
          request: {
            yar: {
              id: request.yar.id
            }
          }
        })}`)
    }
    const savedState = session.getToken(request, tokens.state)
    if (state !== savedState) {
      throw new InvalidStateError(`Invalid state found: ${JSON.stringify({
          request: {
            yar: {
              id: request.yar.id
            }
          }
        })}`)
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = {
  generate,
  verify
}
