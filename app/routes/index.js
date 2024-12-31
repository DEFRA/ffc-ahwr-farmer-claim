const config = require('../config')
const { endemicsIndex } = require('../config/routes')

const getHandler = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      // old world disabled now, just go straight to new world
      return h.redirect(`${config.urlPrefix}/${endemicsIndex}`)
    }
  }
}

module.exports = { handlers: [getHandler] }
