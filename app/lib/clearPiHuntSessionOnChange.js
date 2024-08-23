const { endemicsClaim: { piHuntRecommended, piHuntAllAnimals, dateOfTesting, laboratoryURN, testResults } } = require('../session/keys')
const { setEndemicsClaim } = require('../session')

const clearTestDetails = (request) => {
  setEndemicsClaim(request, dateOfTesting, undefined)
  setEndemicsClaim(request, laboratoryURN, undefined)
  setEndemicsClaim(request, testResults, undefined)
}

function clearPiHuntSessionOnChange (request, piHuntStage) {
  switch (piHuntStage) {
    case 'piHunt':
      setEndemicsClaim(request, piHuntRecommended, undefined)
      setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request)
      break
    case 'piHuntRecommended':
      setEndemicsClaim(request, piHuntAllAnimals, undefined)
      clearTestDetails(request)
      break
    case 'piHuntAllAnimals':
      clearTestDetails(request)
  }
}

module.exports = {
  clearPiHuntSessionOnChange
}
