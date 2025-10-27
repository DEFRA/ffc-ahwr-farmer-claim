import { config } from '../config/index.js'
import { RPA_CONTACT_DETAILS } from 'ffc-ahwr-common-library'

const { applyServiceUri, urlPrefix, customerSurvey, dashboardServiceUri } = config

export const viewContextPlugin = {
  plugin: {
    name: 'view-context',
    register: (server, _) => {
      server.ext('onPreResponse', function (request, h) {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          const { path } = request

          ctx.serviceName = 'Get funding to improve animal health and welfare'
          ctx.urlPrefix = path.startsWith('/cookies') ? '/cookies' : urlPrefix
          ctx.applyServiceUri = applyServiceUri
          ctx.customerSurveyUri = customerSurvey.uri
          ctx.dashboardServiceUri = dashboardServiceUri
          ctx.ruralPaymentsAgency = RPA_CONTACT_DETAILS
          ctx.userIsSignedIn = request.auth.isAuthenticated
          ctx.dashboardLink = `${dashboardServiceUri}/vet-visits`

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
