import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'

const { endemicsClaim: { piHunt, piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults } } = sessionKeys

const clearTestDetails = (sessionEndemicsClaim, request) => {
  sessionEndemicsClaim.dateOfTesting && setEndemicsClaim(request, dateOfTesting, undefined)
  sessionEndemicsClaim.laboratoryURN && setEndemicsClaim(request, laboratoryURN, undefined)
  sessionEndemicsClaim.testResults && setEndemicsClaim(request, testResults, undefined)
}

export function clearPiHuntSessionOnChange (request, piHuntStage) {
  const sessionEndemicsClaim = getEndemicsClaim(request)
  switch (piHuntStage) {
    case 'dateOfVisit':
      sessionEndemicsClaim.piHunt && setEndemicsClaim(request, piHunt, undefined)
      sessionEndemicsClaim.piHuntRecommended && setEndemicsClaim(request, piHuntRecommended, undefined)
      sessionEndemicsClaim.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHunt':
      sessionEndemicsClaim.piHuntRecommended && setEndemicsClaim(request, piHuntRecommended, undefined)
      sessionEndemicsClaim.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHuntRecommended':
      sessionEndemicsClaim.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(sessionEndemicsClaim, request)
      break
    case 'piHuntAllAnimals':
      clearTestDetails(sessionEndemicsClaim, request)
  }
}
