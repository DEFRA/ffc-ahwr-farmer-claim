const parseRoles = require('./parse-roles')

const set = (request, accessToken) => {
  request.cookieAuth.set({
    scope: parseRoles(accessToken.roles),
    account: {
      email: accessToken.email,
      name: `${accessToken.firstName} ${accessToken.lastName}`
    }
  })
}

const clear = (request) => {
  request.cookieAuth.clear()
}

const setAuthCookie = (request, email, userType) => {
  request.cookieAuth.set({ email, userType })
}

module.exports = {
  set,
  clear,
  setAuthCookie
}
