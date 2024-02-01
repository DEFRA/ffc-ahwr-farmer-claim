
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbersUrl,
  endemicsEligibility
} = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsEligibility}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbersUrl}`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (_, h) => {
      return h.view(endemicsEligibility, { backLink })
    }
  }
}
