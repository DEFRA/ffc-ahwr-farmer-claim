const urlPrefix = require('../../config').urlPrefix
const { endemicsWhichReviewAnnual, endemicsDateOfVisit } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const pageView = endemicsDateOfVisit
const backLink = {
  href: `${urlPrefix}/${endemicsWhichReviewAnnual}`
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
