const lookupSubmissionCrumb = async (request) => {
  const { submissionCrumbCache } = request.server.app
  return (await submissionCrumbCache.get(request.plugins.crumb)) ?? {}
}

const cacheSubmissionCrumb = async (request) => {
  const { submissionCrumbCache } = request.server.app
  const crumb = request.plugins.crumb
  await submissionCrumbCache.set(crumb, { crumb })
  console.log('Crumb cached: %s', crumb)
}

module.exports = {
  lookupSubmissionCrumb,
  cacheSubmissionCrumb
}
