const getHandler = {
  method: 'GET',
  path: '/healthy',
  options: {
    auth: false,
    plugins: {
      yar: { skip: true }
    },
    handler: (_, h) => {
      return h.response('ok').code(200)
    }
  }
}

module.exports = { handlers: [getHandler] }
