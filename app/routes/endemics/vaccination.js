const { urlPrefix } = require('../../config')
const { endemicsVaccination } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsVaccination}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        return h.view(endemicsVaccination)
      }
    }
  }
]
