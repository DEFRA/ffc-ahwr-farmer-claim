import { getEndemicsClaim } from '../session/index.js'

function addBindings (request) {
  const endemicsClaim = getEndemicsClaim(request)
  request.logger.setBindings({
    sbi: endemicsClaim?.organisation?.sbi,
    crn: endemicsClaim?.organisation?.crn,
    reference: endemicsClaim?.reference,
    applicationReference: endemicsClaim?.latestEndemicsApplication?.reference
  })
}

export const loggingContextPlugin = {
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
