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
  try {
    if (request.query.error) {
      throw new Error(`Request query error found: ${JSON.stringify({
        request: {
          yar: {
            id: request.yar.id
          },
          query: {
            error_description: request.query.error_description
          }
        }
      })}`)
    }
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
      throw new InvalidStateError(`State mismatch: ${JSON.stringify({
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
