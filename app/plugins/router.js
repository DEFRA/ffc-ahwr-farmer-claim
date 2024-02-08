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
    require('../routes/endemics/which-review-annual'),
    require('../routes/endemics/number-of-fluid-oral-samples'),
    require('../routes/endemics/species-numbers'),
    require('../routes/endemics/which-type-of-review'),
    require('../routes/endemics/you-cannot-claim'),
    require('../routes/endemics/number-of-species-tested'),
    require('../routes/endemics/vet-name')
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
