const { endemicsWhichReviewAnnual, endemicsDateOfVisit } = require('../../config/routes')

const pageUrl = `/claim/endemics/${endemicsDateOfVisit}`
const pageView = `endemics/${endemicsDateOfVisit}`
const backLink = {
  href: `/claim/endemics/${endemicsWhichReviewAnnual}`
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
