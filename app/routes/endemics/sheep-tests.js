const { urlPrefix } = require('../../config')
const { endemicsSheepEndemicsPackage, endemicsSheepTests } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsSheepTests}`
const backLink = endemicsSheepEndemicsPackage

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      return h.view(endemicsSheepTests, {
        backLink
      })
    }
  }
}
