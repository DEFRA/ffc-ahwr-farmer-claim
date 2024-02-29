const urlPrefix = require('../../config').urlPrefix
const { endemicsSheepEndemicsPackage, endemicsSheepEweTests } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsSheepEweTests}`
const backLink = endemicsSheepEndemicsPackage

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view(endemicsSheepEweTests, {
        backLink
      })
    }
  }
}