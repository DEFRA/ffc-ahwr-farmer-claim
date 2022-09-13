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
  require('../routes/vet-name'),
  require('../routes/vet-practice'),
  require('../routes/vet-rcvs'),
  require('../routes/verify-login'),
  require('../routes/vet-visit-date')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
    }
  }
}
