const config = require('../config')

let routes = [].concat(
  require('../routes/assets'),
  require('../routes/cookies'),
  require('../routes/check-answers'),
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/index'),
  require('../routes/visit-review'),
  require('../routes/details-incorrect'),
  require('../routes/submit-claim'),
  require('../routes/urn-result'),
  require('../routes/vet-name'),
  require('../routes/animals-tested'),
  require('../routes/number-of-animals-ineligible'),
  require('../routes/vet-rcvs'),
  require('../routes/vet-visit-date'),
  require('../routes/signin-oidc')
)

if (config.endemics.enabled) {
  routes = routes.concat(
    require('../routes/endemics/index'),
    require('../routes/endemics/test-urn'),
    require('../routes/endemics/test-results'),
    require('../routes/endemics/date-of-visit'),
    require('../routes/endemics/which-species'),
    require('../routes/endemics/number-of-fluid-oral-samples'),
    require('../routes/endemics/number-of-samples-tested'),
    require('../routes/endemics/species-numbers'),
    require('../routes/endemics/which-type-of-review'),
    require('../routes/endemics/number-of-species-tested'),
    require('../routes/endemics/vet-name'),
    require('../routes/endemics/vet-rcvs'),
    require('../routes/endemics/check-answers'),
    require('../routes/endemics/confirmation'),
    require('../routes/endemics/date-of-testing'),
    require('../routes/endemics/vaccination'),
    require('../routes/endemics/disease-status'),
    require('../routes/endemics/sheep-endemics-package'),
    require('../routes/endemics/sheep-tests'),
    require('../routes/endemics/biosecurity'),
    require('../routes/endemics/vet-visits-review-test-results'),
    require('../routes/endemics/sheep-test-results'),
    require('../routes/endemics/pi-hunt'),
    require('../routes/endemics/pi-hunt-recommended'),
    require('../routes/endemics/pi-hunt-all-animals')
  )
}

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
    }
  }
}
