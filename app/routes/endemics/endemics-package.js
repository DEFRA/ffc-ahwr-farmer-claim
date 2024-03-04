const { urlPrefix } = require('../../config')
const { endemicsEndemicsPackage } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsEndemicsPackage}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        return h.view(endemicsEndemicsPackage)
      }
    }
  }
]
