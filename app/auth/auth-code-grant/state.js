const { v4: uuidv4 } = require('uuid')
const config = require('../../config')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const InvalidStateError = require('../../exceptions/invalid-state-error')

const generate = (request) => {
  const state = {
    id: uuidv4(),
    namespace: config.namespace
  }

  const base64EncodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  session.setToken(request, tokens.state, base64EncodedState)
  return base64EncodedState
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
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
    const savedState = JSON.parse(Buffer.from(session.getToken(request, tokens.state), 'base64').toString('ascii'))
    if (decodedState.id !== savedState.id) {
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
