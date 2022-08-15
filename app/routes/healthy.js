module.exports = {
  method: 'GET',
  path: '/healthy',
  handler: (_, h) => {
    return h.response('ok').code(200)
  }
}
