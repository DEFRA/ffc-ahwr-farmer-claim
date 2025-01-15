const config = require('../config')

const alwaysOnRouteHandlers = [require('../routes/assets').handlers,
  require('../routes/cookies').handlers,
  require('../routes/healthy').handlers,
  require('../routes/healthz').handlers,
  require('../routes/index').handlers,
  require('../routes/signin-oidc').handlers].flat()

const endemicsSpecificRouteHandlers = [
  require('../routes/endemics/index').handlers,
  require('../routes/endemics/test-urn').handlers,
  require('../routes/endemics/test-results').handlers,
  require('../routes/endemics/date-of-visit').handlers,
  require('../routes/endemics/number-of-fluid-oral-samples').handlers,
  require('../routes/endemics/number-of-samples-tested').handlers,
  require('../routes/endemics/species-numbers').handlers,
  require('../routes/endemics/number-of-species-tested').handlers,
  require('../routes/endemics/vet-name').handlers,
  require('../routes/endemics/vet-rcvs').handlers,
  require('../routes/endemics/check-answers').handlers,
  require('../routes/endemics/confirmation').handlers,
  require('../routes/endemics/date-of-testing').handlers,
  require('../routes/endemics/vaccination').handlers,
  require('../routes/endemics/disease-status').handlers,
  require('../routes/endemics/sheep-endemics-package').handlers,
  require('../routes/endemics/sheep-tests').handlers,
  require('../routes/endemics/biosecurity').handlers,
  require('../routes/endemics/vet-visits-review-test-results').handlers,
  require('../routes/endemics/sheep-test-results').handlers,
  require('../routes/endemics/pi-hunt').handlers,
  require('../routes/endemics/pi-hunt-recommended').handlers,
  require('../routes/endemics/pi-hunt-all-animals').handlers
].flat()

const endemicsWithMsOffHandlers = [
  require('../routes/endemics/which-type-of-review').handlers,
  require('../routes/endemics/which-species').handlers
].flat()

const endemicsWithMsOnHandlers = [
  require('../routes/endemics/which-type-of-review-ms').handlers,
  require('../routes/endemics/which-species-ms').handlers
].flat()

const devLoginHandlers = require('../routes/endemics/dev-sign-in').handlers

let routes = alwaysOnRouteHandlers

if (config.endemics.enabled) {
  routes = routes.concat(endemicsSpecificRouteHandlers)

  if (!config.multiSpecies.enabled) {
    routes = routes.concat(endemicsWithMsOffHandlers)
  } else {
    routes = routes.concat(endemicsWithMsOnHandlers)
  }
}

if (config.devLogin.enabled) {
  routes = routes.concat(devLoginHandlers)
}

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
    }
  }
}
