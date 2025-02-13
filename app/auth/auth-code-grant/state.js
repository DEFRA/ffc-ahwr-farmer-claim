import { v4 as uuidv4 } from 'uuid'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import { getToken, setToken } from '../../session/index.js'

export const generate = (request) => {
  const state = {
    id: uuidv4(),
    namespace: config.namespace,
    source: 'claim'
  }

  const base64EncodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  setToken(request, sessionKeys.tokens.state, base64EncodedState)
  return base64EncodedState
}

export const verify = (request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      return false
    }
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
    const savedState = JSON.parse(Buffer.from(getToken(request, sessionKeys.tokens.state), 'base64').toString('ascii'))
    return decodedState.id === savedState.id
  } else {
    request.logger.setBindings({ stateError: request.query.error })
    return false
  }
}
