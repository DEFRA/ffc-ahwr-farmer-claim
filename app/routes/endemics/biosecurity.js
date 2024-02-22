const { urlPrefix } = require('../../config')
const { endemicsBiosecurity } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        return h.view(endemicsBiosecurity)
      }
    }
  }
]
