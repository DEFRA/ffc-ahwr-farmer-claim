const { endemicsWhichReviewAnnual, endemicsDateOfVisit } = require('../../config/routes')

const pageUrl = `/claim/${endemicsDateOfVisit}`
const pageView = endemicsDateOfVisit
const backLink = {
  href: `/claim${endemicsWhichReviewAnnual}`
}

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view(pageView, {
        backLink
      })
    }
  }
}
