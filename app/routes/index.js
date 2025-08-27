import links from '../config/routes.js'
import { prefixUrl } from './utils/page-utils.js'

export const entryPointHandlers = [{
  method: 'GET',
  path: '/claim',
  options: {
    auth: { mode: 'try' },
    handler: async (_request, h) => {
      // old world disabled now, just go straight to new world
      return h.redirect(prefixUrl(links.endemicsIndex))
    }
  }
}]
