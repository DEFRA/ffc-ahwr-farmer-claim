const { urlPrefix } = require('../../config')
const { endemicsDiseaseStatus } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsDiseaseStatus}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        return h.view(endemicsDiseaseStatus)
      }
    }
  }
]
