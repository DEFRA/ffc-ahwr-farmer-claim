import { getEndemicsClaim } from '../session/index.js'
import links from '../config/routes.js'

export const redirectAgreementRedactedPlugin = {
  plugin: {
    name: 'redirect-agreement-redacted',
    register: (server, _) => {
      server.ext('onPreHandler', (request, h) => {
        if (request.method === 'get' &&
          request.path.includes('/claim/endemics/') &&
          !request.path.includes('dev-sign-in') &&
          !request.path.includes('assets') &&
          !request.path.includes('which-species') // entry page of journey
        ) {
          const { latestEndemicsApplication } = getEndemicsClaim(request)

          if (latestEndemicsApplication?.applicationRedacts?.length) {
            return h.redirect(links.claimDashboard).takeover()
          }
        }
        return h.continue
      })
    }
  }
}
