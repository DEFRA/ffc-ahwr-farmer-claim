const urlPrefix = require('../../config').urlPrefix
const { vetVisits, endemicsYouCannotClaim } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsYouCannotClaim}`
const backLink = {
  href: vetVisits
}

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view(endemicsYouCannotClaim, {
        backLink
      })
    }
  }
}
