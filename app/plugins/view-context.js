const { serviceName, applyServiceUri } = require('../config')

module.exports = {
  plugin: {
    name: 'view-context',
    register: (server, _) => {
      server.ext('onPreResponse', function (request, h) {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          const { path } = request

          let serviceUrl = '/'

          if (path.startsWith('/cookies')) {
            serviceUrl = '/cookies'
          }
          ctx.serviceName = serviceName
          ctx.serviceUrl = serviceUrl
          ctx.applyServiceUri = applyServiceUri

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
