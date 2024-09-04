const { endemicsClaim: { piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults } } = require('../session/keys')
const { setEndemicsClaim, getEndemicsClaim } = require('../session')

const clearTestDetails = (request, session) => {
  session.dateOfTesting && setEndemicsClaim(request, dateOfTesting, undefined)
  session.laboratoryURN && setEndemicsClaim(request, laboratoryURN, undefined)
  session.testResults && setEndemicsClaim(request, testResults, undefined)
}

function clearPiHuntSessionOnChange (request, piHuntStage) {
  const session = getEndemicsClaim(request)
  switch (piHuntStage) {
    case 'piHunt':
      session.piHuntRecommended && setEndemicsClaim(request, piHuntRecommended, undefined)
      session.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request, session)
      break
    case 'piHuntRecommended':
      session.piHuntAllAnimals && setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request, session)
      break
    case 'piHuntAllAnimals':
      clearTestDetails(request, session)
  }
}

module.exports = {
  clearPiHuntSessionOnChange
}
