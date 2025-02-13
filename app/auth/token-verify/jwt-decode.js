import jwt from 'jsonwebtoken'

export const decodeJwt = (token) => {
  const decodedToken = jwt.decode(token, { complete: true })
  if (!decodedToken) {
    throw new Error('The token has not been decoded')
  }
  return decodedToken.payload
}
