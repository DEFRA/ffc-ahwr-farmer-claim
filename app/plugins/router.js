import { config } from '../config/index.js'
import { healthHandlers } from '../routes/health.js'
import { entryPointHandlers } from '../routes/index.js'
import { cookiesHandlers } from '../routes/cookies.js'
import { assetsRouteHandlers } from '../routes/assets.js'
import { signInHandler } from '../routes/signin-oidc.js'
import { indexHandlers } from '../routes/endemics/index.js'
import { testUrnHandlers } from '../routes/endemics/test-urn.js'
import { testResultsHandlers } from '../routes/endemics/test-results.js'
import { numberOfOralFluidSamplesHandlers } from '../routes/endemics/number-of-fluid-oral-samples.js'
import { numberOfSamplesTestedHandlers } from '../routes/endemics/number-of-samples-tested.js'
import { numberOfSpeciesHandlers } from '../routes/endemics/number-of-species-tested.js'
import { speciesNumbersHandlers } from '../routes/endemics/species-numbers.js'
import { vetsNameHandlers } from '../routes/endemics/vet-name.js'
import { vetRCVSHandlers } from '../routes/endemics/vet-rcvs.js'
import { checkAnswersHandlers } from '../routes/endemics/check-answers.js'
import { confirmationHandlers } from '../routes/endemics/confirmation.js'
import { dateOfTestingHandlers } from '../routes/endemics/date-of-testing.js'
import { dateOfTestingMhHandlers } from '../routes/endemics/date-of-testing-mh.js'
import { vaccinationHandlers } from '../routes/endemics/vaccination.js'
import { diseaseStatusHandlers } from '../routes/endemics/disease-status.js'
import { sheepEndemicsPackageHandlers } from '../routes/endemics/sheep-endemics-package.js'
import { sheepTestsHandlers } from '../routes/endemics/sheep-tests.js'
import { sheepTestResultsHandlers } from '../routes/endemics/sheep-test-results.js'
import { biosecurityHandlers } from '../routes/endemics/biosecurity.js'
import { vetVisitsReviewTestResultsHandlers } from '../routes/endemics/vet-visits-review-test-results.js'
import { piHuntHandlers } from '../routes/endemics/pi-hunt.js'
import { piHuntAllAnimalsHandlers } from '../routes/endemics/pi-hunt-all-animals.js'
import { piHuntRecommendedHandlers } from '../routes/endemics/pi-hunt-recommended.js'
import { dateOfVisitMSHandlers } from '../routes/endemics/date-of-visit-ms.js'
import { whichSpeciesMsHandlers } from '../routes/endemics/which-species-ms.js'
import { whichReviewMSHandlers } from '../routes/endemics/which-type-of-review-ms.js'
import { dateOfVisitMhHandlers } from '../routes/endemics/date-of-visit-mh.js'
import { selectTheHerdHandlers } from '../routes/endemics/select-the-herd.js'
import { enterHerdNameHandlers } from '../routes/endemics/enter-herd-name.js'
import { enterCphNumberHandlers } from '../routes/endemics/enter-cph-number.js'
import { herdOthersOnSbiHandlers } from '../routes/endemics/herd-others-on-sbi.js'
import { enterHerdDetailsHandlers } from '../routes/endemics/enter-herd-details.js'
import { checkHerdDetailsHandlers } from '../routes/endemics/check-herd-details.js'
import { sameHerdHandlers } from '../routes/endemics/same-herd.js'
import { devSignInHandlers } from '../routes/endemics/dev-sign-in.js'

const alwaysOnRouteHandlers = [
  assetsRouteHandlers,
  cookiesHandlers,
  healthHandlers,
  entryPointHandlers,
  signInHandler].flat()

const endemicsSpecificRouteHandlers = [
  indexHandlers,
  testUrnHandlers,
  testResultsHandlers,
  numberOfOralFluidSamplesHandlers,
  numberOfSamplesTestedHandlers,
  speciesNumbersHandlers,
  numberOfSpeciesHandlers,
  vetsNameHandlers,
  vetRCVSHandlers,
  checkAnswersHandlers,
  confirmationHandlers,
  vaccinationHandlers,
  diseaseStatusHandlers,
  sheepEndemicsPackageHandlers,
  sheepTestsHandlers,
  biosecurityHandlers,
  vetVisitsReviewTestResultsHandlers,
  sheepTestResultsHandlers,
  piHuntHandlers,
  piHuntAllAnimalsHandlers,
  piHuntRecommendedHandlers,
  whichReviewMSHandlers,
  whichSpeciesMsHandlers
].flat()

const endemicsWithMsOnHandlers = [
  dateOfVisitMSHandlers,
  dateOfTestingHandlers
].flat()

const endemicsWithMhOnHandlers = [
  dateOfVisitMhHandlers,
  dateOfTestingMhHandlers,
  selectTheHerdHandlers,
  enterHerdNameHandlers,
  enterCphNumberHandlers,
  herdOthersOnSbiHandlers,
  enterHerdDetailsHandlers,
  checkHerdDetailsHandlers,
  sameHerdHandlers
].flat()

const mapRoutes = () => {
  let routes = alwaysOnRouteHandlers
  routes = routes.concat(endemicsSpecificRouteHandlers)

  if (config.multiHerds.enabled) {
    routes = routes.concat(endemicsWithMhOnHandlers)
  } else {
    routes = routes.concat(endemicsWithMsOnHandlers)
  }

  if (config.devLogin.enabled) {
    routes = routes.concat(devSignInHandlers)
  }
  return routes
}

export const routerPlugin = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(mapRoutes())
    }
  }
}
