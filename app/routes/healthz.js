const getHandler = {
  method: 'GET',
  path: '/healthz',
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
