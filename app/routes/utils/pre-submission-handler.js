const Boom = require('@hapi/boom')
const crumbCache = require('./crumb-cache')

const generateNewCrumb = async (request, h) => {
  delete request.plugins.crumb
  request.server.plugins.crumb.generate(request, h)
  console.log('New crumb created: %s', request.plugins.crumb)
}

const preSubmissionHandler = async (request, h) => {
  if (request.method === 'post') {
    const lookupCrumb = await crumbCache.lookupSubmissionCrumb(request)
    if (lookupCrumb?.crumb) {
      console.log('Duplicate crumb found: %s', request.plugins.crumb)
      await generateNewCrumb(request, h)
      return Boom.forbidden('Duplicate submission')
    } else {
      await crumbCache.cacheSubmissionCrumb(request)
      await generateNewCrumb(request, h)
      return h.continue
    }
  } else {
    return h.continue
  }
}

module.exports = preSubmissionHandler
