import { v4 as uuidv4 } from 'uuid'
import { sessionKeys } from '../session/keys.js'
import { setEndemicsClaim } from '../session/index.js'

const {
  endemicsClaim: {
    unnamedHerdId: unnamedHerdIdKey
  }
} = sessionKeys

export const getUnnamedHerdId = (request, idFromSession) => {
  if (idFromSession) {
    return idFromSession
  }

  const id = uuidv4()
  setEndemicsClaim(request, unnamedHerdIdKey, id)
  return id
}
