
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbersUrl,
  endemicsIneligibility
} = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsIneligibility}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbersUrl}`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (_, h) => {
      return h.view(endemicsIneligibility, { backLink })
    }
  }
}
