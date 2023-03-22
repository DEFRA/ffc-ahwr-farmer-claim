const config = require('../config')

const routes = [].concat(
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
  require('../routes/vet-rcvs'),
  require('../routes/vet-visit-date')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
      if (config.authConfig.defraId.enabled === true) {
        server.route(require('../routes/auth/signin-oidc'))
      } else {
        server.route(require('../routes/select-your-business'))
        server.route(require('../routes/no-business-available-to-claim-for'))
        server.route(require('../routes/auth/verify-login'))
        server.route(require('../routes/auth/login'))
      }
    }
  }
}
