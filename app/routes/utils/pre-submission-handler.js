const Boom = require('@hapi/boom')
const crumbCache = require('./crumb-cache')

const preSubmissionHandler = async (request, h) => {
  if (request.method === 'post') {
    const lookupCrumb = await crumbCache.lookupSubmissionCrumb(request)
    if (lookupCrumb?.crumb) {
      return Boom.forbidden('Duplicate submission')
    } else {
      await crumbCache.cacheSubmissionCrumb(request)
      await crumbCache.generateNewCrumb(request, h)
      return h.continue
    }
  } else {
    return h.continue
  }
}

module.exports = preSubmissionHandler
