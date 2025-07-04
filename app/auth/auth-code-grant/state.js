import { v4 as uuidv4 } from 'uuid'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import { setToken } from '../../session/index.js'

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
