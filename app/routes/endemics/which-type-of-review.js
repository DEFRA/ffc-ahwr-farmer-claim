const urlPrefix = require('../../config').urlPrefix
const { vetVisits, endemicsWhichTypeOfReview } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = {
  href: vetVisits
}

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view(endemicsWhichTypeOfReview, {
        backLink
      })
    }
  }
}
