import Boom from '@hapi/boom'
import { cacheSubmissionCrumb, generateNewCrumb, lookupSubmissionCrumb } from './crumb-cache.js'

export const preSubmissionHandler = async (request, h) => {
  if (request.method === 'post') {
    const lookupCrumb = await lookupSubmissionCrumb(request)
    if (lookupCrumb?.crumb) {
      return Boom.forbidden('Duplicate submission')
    } else {
      await cacheSubmissionCrumb(request)
      await generateNewCrumb(request, h)
      return h.continue
    }
  } else {
    return h.continue
  }
}
