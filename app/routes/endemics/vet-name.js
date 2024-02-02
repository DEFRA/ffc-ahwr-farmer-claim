
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsEligibility,
  endemicsVetName
} = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsVetName}`
const backLink = `${urlPrefix}/${endemicsEligibility}`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (_, h) => {
      return h.view(endemicsVetName, { backLink })
    }
  }
}
