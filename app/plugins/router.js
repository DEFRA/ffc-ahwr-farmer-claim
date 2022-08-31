const routes = [].concat(
  require('../routes/assets'),
  require('../routes/cookies'),
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/index'),
  require('../routes/login'),
  require('../routes/visit-review'),
  require('../routes/details-incorrect'),
  require('../routes/submit-claim'),
  require('../routes/verify-login')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
    }
  }
}
