import { config } from '../config/index.js'

const { applyServiceUri, urlPrefix, customerSurvey } = config

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

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
