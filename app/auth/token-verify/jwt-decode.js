const jwt = require('jsonwebtoken')

const decodeJwt = (token) => {
  const decodedToken = jwt.decode(token, { complete: true })
  if (!decodedToken) {
    throw new Error('The token has not been decoded')
  }
  return decodedToken.payload
}

module.exports = decodeJwt
