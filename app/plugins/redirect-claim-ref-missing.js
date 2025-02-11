import { getEndemicsClaim } from '../session/index.js'
import links from '../config/routes.js'

export const redirectWhenClaimRefMissingPlugin = {
  plugin: {
    name: 'redirect-claim-ref-missing',
    register: (server, _) => {
      server.ext('onPreHandler', (request, h) => {
        if (request.method === 'get' && request.path.includes('/claim/endemics/') && !request.path.includes('dev-sign-in') && !request.path.includes('assets')) {
          const claim = getEndemicsClaim(request)
          if (!claim?.reference) {
            return h.redirect(links.claimDashboard).takeover()
          }
        }
        return h.continue
      })
    }
  }
}
