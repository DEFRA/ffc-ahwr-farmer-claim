const Boom = require('@hapi/boom')
const { lookupSubmissionCrumb } = require('../../auth')

async function cacheSubmissionCrumb (request) {
  const { submissionCrumbCache } = request.server.app

  const crumb = request.plugins.crumb
  await submissionCrumbCache.set(crumb, { crumb })
  console.log('Crumb cached: %s', crumb)
}

async function generateNewCrumb (request, h) {
  delete request.plugins.crumb
  request.server.plugins.crumb.generate(request, h)
  console.log('New crumb created: %s', request.plugins.crumb)
}

const preSubmissionHandler = async (request, h) => {
  const lookupCrumb = await lookupSubmissionCrumb(request)

  if (lookupCrumb?.crumb?.length > 0) {
    console.log('Duplicate crumb found: %s', request.plugins.crumb)
    await generateNewCrumb(request, h)
    return Boom.internal()
  } else {
    await cacheSubmissionCrumb(request)
    await generateNewCrumb(request, h)
    return h.continue
  }
}

module.exports = preSubmissionHandler
