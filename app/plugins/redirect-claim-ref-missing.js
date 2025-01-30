const { claimDashboard } = require('../config/routes')
const session = require('../session')

module.exports = {
  plugin: {
    name: 'redirect-claim-ref-missing',
    register: (server, _) => {
      server.ext('onPreHandler', (request, h) => {
        if (request.method === 'get' && request.path.includes('/claim/endemics/') && !request.path.includes('dev-sign-in')) {
          const claim = session.getEndemicsClaim(request)
          if (!claim?.reference) {
            return h.redirect(claimDashboard).takeover()
          }
        }
        return h.continue
      })
    }
  }
}
