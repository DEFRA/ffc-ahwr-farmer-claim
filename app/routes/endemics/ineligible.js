
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsIneligibility
} = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsIneligibility}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbers}`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (_, h) => {
      return h.view(endemicsIneligibility, { backLink })
    }
  }
}
