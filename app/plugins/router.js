const config = require('../config')

let routes = [].concat(
  require('../routes/assets').handlers,
  require('../routes/cookies').handlers,
  require('../routes/check-answers').handlers,
  require('../routes/healthy').handlers,
  require('../routes/healthz').handlers,
  require('../routes/index').handlers,
  require('../routes/visit-review').handlers,
  require('../routes/details-incorrect').handlers,
  require('../routes/submit-claim').handlers,
  require('../routes/urn-result').handlers,
  require('../routes/vet-name').handlers,
  require('../routes/animals-tested').handlers,
  require('../routes/number-of-animals-ineligible').handlers,
  require('../routes/vet-rcvs').handlers,
  require('../routes/vet-visit-date').handlers,
  require('../routes/signin-oidc').handlers
)

if (config.endemics.enabled) {
  routes = routes.concat(
    require('../routes/endemics/index').handlers,
    require('../routes/endemics/test-urn').handlers,
    require('../routes/endemics/test-results').handlers,
    require('../routes/endemics/date-of-visit').handlers,
    require('../routes/endemics/which-species').handlers,
    require('../routes/endemics/number-of-fluid-oral-samples').handlers,
    require('../routes/endemics/number-of-samples-tested').handlers,
    require('../routes/endemics/species-numbers').handlers,
    require('../routes/endemics/which-type-of-review').handlers,
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
