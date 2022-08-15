module.exports = {
  method: 'GET',
  path: '/healthz',
  handler: (_, h) => {
    return h.response('ok').code(200)
  }
}
