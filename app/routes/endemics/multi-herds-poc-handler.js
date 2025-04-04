import { config } from '../../config/index.js'

const urlPrefix = config.urlPrefix

const pageHandler = {
  method: 'GET',
  path: `${urlPrefix}/multipleHerds/{page}`,
  options: {
    auth: false
  },
  handler: async (request, h) => {
    const { page } = request.params

    return h.view(`multipleHerds/${page}`)
  }
}

const getHandler = {
  method: 'GET',
  path: `${urlPrefix}/multipleHerds`,
  options: {
    auth: false
  },
  handler: async (request, h) => {
    return h.view('multipleHerds/index')
  }
}

export const multiHerdsPocPagesHandlers = [pageHandler, getHandler]
