const { serviceName, applyServiceUri, urlPrefix } = require('../config')

module.exports = {
  plugin: {
    name: 'view-context',
    register: (server, _) => {
      server.ext('onPreResponse', function (request, h) {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          const { path } = request

          ctx.serviceName = serviceName
          ctx.urlPrefix = path.startsWith('/cookies') ? '/cookies' : urlPrefix
          ctx.applyServiceUri = applyServiceUri

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
