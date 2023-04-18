const clientCredentialCacheKey = 'Client_Credential'

const lookupClientCredentialToken = async (request) => {
  const { clientCredentialCache } = request.server.app
  return (await clientCredentialCache.get(clientCredentialCacheKey)) ?? {}
}

const setExpiryDate = (expiresIn) => {
  const expiryDate = new Date()
  // Use token expiry minus 5 minutes
  expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn - (5 * 60))
  return expiryDate.toISOString()
}

const cacheClientCredentialToken = async (request, token) => {
  const { clientCredentialCache } = request.server.app
  const expiryDate = setExpiryDate(token.expires_in)
  await clientCredentialCache.set(clientCredentialCacheKey, { token, expiry_date: expiryDate })
}

const hasExpired = (clientCredentialExpiryDate) => {
  const currentDate = new Date().getTime()
  const expiryDate = new Date(clientCredentialExpiryDate)
  return expiryDate.getTime() < currentDate
}

const clientCredentialsValid = (clientCredentials) => {
  if (!clientCredentials.token) return false
  if (hasExpired(clientCredentials.expiry_date)) return false

  return true
}

module.exports = {
  lookupClientCredentialToken,
  cacheClientCredentialToken,
  clientCredentialsValid
}
