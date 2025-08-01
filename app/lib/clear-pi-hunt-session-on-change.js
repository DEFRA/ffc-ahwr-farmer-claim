import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'

const { endemicsClaim: { piHunt, piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults } } = sessionKeys

const clearTestDetails = (sessionEndemicsClaim, request) => {
  sessionEndemicsClaim.dateOfTesting && setEndemicsClaim(request, dateOfTesting, undefined)
  sessionEndemicsClaim.laboratoryURN && setEndemicsClaim(request, laboratoryURN, undefined)
  sessionEndemicsClaim.testResults && setEndemicsClaim(request, testResults, undefined)
}

const clearPiHuntAllAnimals = (sessionEndemicsClaim, request) => {
  sessionEndemicsClaim.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
}
const clearPiHuntRecommended = (sessionEndemicsClaim, request) => {
  sessionEndemicsClaim.piHuntRecommended && setEndemicsClaim(request, piHuntRecommended, undefined)
}

export function clearPiHuntSessionOnChange (request, piHuntStage) {
  const sessionEndemicsClaim = getEndemicsClaim(request)
  switch (piHuntStage) {
    case 'dateOfVisit':
      sessionEndemicsClaim.piHunt && setEndemicsClaim(request, piHunt, undefined)
      clearPiHuntRecommended(sessionEndemicsClaim, request)
      clearPiHuntAllAnimals(sessionEndemicsClaim, request)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHunt':
      clearPiHuntRecommended(sessionEndemicsClaim, request)
      clearPiHuntAllAnimals(sessionEndemicsClaim, request)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHuntRecommended':
      clearPiHuntAllAnimals(sessionEndemicsClaim, request)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHuntAllAnimals':
      clearTestDetails(sessionEndemicsClaim, request)
      break
    default:
      // No action needed otherwise
      break
  }
}
