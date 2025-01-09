const session = require('../session')

function addBindings (request) {
  request.logger.setBindings({
    sbi: session.getEndemicsClaim(request)?.organisation?.sbi,
    crn: session.getEndemicsClaim(request)?.organisation?.crn,
    reference: session.getEndemicsClaim(request)?.reference,
    applicationReference: session.getEndemicsClaim(request)?.latestEndemicsApplication?.reference
  })
}

module.exports = {
  plugin: {
    name: 'logging-context',
    register: (server, _) => {
      server.ext('onPreHandler', (request, h) => {
        if (!request.path.includes('assets') && !request.path.includes('health')) {
          addBindings(request)
        }

        return h.continue
      })
    }
  }
}
