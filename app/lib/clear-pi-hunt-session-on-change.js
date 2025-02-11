import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'

const { endemicsClaim: { piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults } } = sessionKeys

const clearTestDetails = (request) => {
  dateOfTesting && setEndemicsClaim(request, dateOfTesting, undefined)
  laboratoryURN && setEndemicsClaim(request, laboratoryURN, undefined)
  testResults && setEndemicsClaim(request, testResults, undefined)
}

export function clearPiHuntSessionOnChange (request, piHuntStage) {
  const sessionEndemicsClaim = getEndemicsClaim(request)
  switch (piHuntStage) {
    case 'piHunt':
      piHuntRecommended && setEndemicsClaim(request, piHuntRecommended, undefined)
      piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request)
      break
    case 'piHuntRecommended':
      sessionEndemicsClaim.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request)
      break
    case 'piHuntAllAnimals':
      clearTestDetails(request)
  }
}
