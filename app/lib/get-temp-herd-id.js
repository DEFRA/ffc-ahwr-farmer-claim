import { v4 as uuidv4 } from 'uuid'
import { sessionKeys } from '../session/keys.js'
import { setEndemicsClaim } from '../session/index.js'

const {
  endemicsClaim: {
    tempHerdId: tempHerdIdKey
  }
} = sessionKeys

export const getTempHerdId = (request, tempHerdIdFromSession) => {
  if (tempHerdIdFromSession) {
    return tempHerdIdFromSession
  }

  const tempHerdId = uuidv4()
  setEndemicsClaim(request, tempHerdIdKey, tempHerdId, { shouldEmitEvent: false })
  return tempHerdId
}
