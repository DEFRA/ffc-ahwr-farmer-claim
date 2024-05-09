const { serviceName, applyServiceUri, urlPrefix, endemics } = require('../config')

module.exports = {
  plugin: {
    name: 'view-context',
    register: (server, _) => {
      server.ext('onPreResponse', function (request, h) {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          const { path } = request

          ctx.serviceName = !endemics.enabled ? serviceName : 'Get funding to improve animal health and welfare'
          ctx.urlPrefix = path.startsWith('/cookies') ? '/cookies' : urlPrefix
          ctx.applyServiceUri = applyServiceUri

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
