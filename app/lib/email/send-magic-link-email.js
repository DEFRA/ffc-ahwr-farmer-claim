const getToken = require('../auth/get-token')
const sendEmail = require('./send-email')
const { serviceUri } = require('../../config')
const { templateIdFarmerClaimLogin } = require('../../config').notifyConfig
const { farmerClaim } = require('../../constants/user-types')

async function createAndCacheToken (request, email, redirectTo, userType, data) {
  const { magiclinkCache } = request.server.app

  const token = await getToken(email)
  const tokens = await magiclinkCache.get(email) ?? []
  tokens.push(token)
  await magiclinkCache.set(email, tokens)
  await magiclinkCache.set(token, { email, redirectTo, userType, data })
  return token
}

async function sendMagicLinkEmail (request, email, templateId, redirectTo, userType, data) {
  const token = await createAndCacheToken(request, email, redirectTo, userType, data)

  const magicLink = new URL(`${serviceUri}/verify-login`)
  magicLink.searchParams.append('email', email)
  magicLink.searchParams.append('token', token)

  console.log(`Sending magic link ${magicLink.href} to email ${email}`)

  return sendEmail(templateId, email, {
    personalisation: { magiclink: magicLink.href },
    reference: token
  })
}

async function sendFarmerClaimLoginMagicLink (request, email) {
  const redirectTo = `select-your-business?businessEmail=${email}`
  return sendMagicLinkEmail(request, email, templateIdFarmerClaimLogin, redirectTo, farmerClaim)
}

module.exports = {
  sendFarmerClaimLoginMagicLink
}
