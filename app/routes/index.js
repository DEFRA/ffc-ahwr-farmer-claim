import { config } from '../config/index.js'
import links from '../config/routes.js'

export const entryPointHandlers = [{
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      // old world disabled now, just go straight to new world
      return h.redirect(`${config.urlPrefix}/${links.endemicsIndex}`)
    }
  }
}]
