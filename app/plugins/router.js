const preSubmissionHandler = require('../routes/utils/pre-submission-handler')
const routes = [].concat(
  require('../routes/assets'),
  require('../routes/cookies'),
  require('../routes/check-answers'),
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/index'),
  require('../routes/login'),
  require('../routes/visit-review'),
  require('../routes/details-incorrect'),
  require('../routes/submit-claim'),
  require('../routes/urn-result'),
  require('../routes/vet-name'),
  require('../routes/vet-rcvs'),
  require('../routes/verify-login'),
  require('../routes/vet-visit-date')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
      server.route(require('../routes/select-your-business'))
      server.route(require('../routes/no-business-available-to-claim-for'))

      server.ext('onPreHandler', async (request, h) => {
        if (request.method === 'post') {
          return await preSubmissionHandler(request, h)
        } else {
          return h.continue
        }
      })
    }
  }
}
