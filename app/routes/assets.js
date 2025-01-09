const getHandler = {
  method: 'GET',
  path: '/claim/assets/{path*}',
  options: {
    auth: false,
    handler: {
      directory: {
        path: ['app/frontend/dist', 'node_modules/govuk-frontend/dist/govuk/assets']
      }
    },
    cache: {
      privacy: 'private'
    },
    tags: ['assets']
  }
}

module.exports = { handlers: [getHandler] }
