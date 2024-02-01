
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsEligibility
} = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsEligibility}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbers}`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (_, h) => {
      return h.view(endemicsEligibility, { backLink })
    }
  }
}
