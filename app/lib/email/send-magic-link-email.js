const getToken = require('../auth/get-token')
const sendEmail = require('./send-email')
const { serviceUri, selectYourBusiness } = require('../../config')
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

  return sendEmail(templateId, email, {
    personalisation: { magiclink: `${serviceUri}/verify-login?token=${token}&email=${email}` },
    reference: token
  })
}

async function sendFarmerClaimLoginMagicLink (request, email) {
  const redirectTo = selectYourBusiness.enabled ? `select-your-business?businessEmail=${email}` : 'visit-review'
  return sendMagicLinkEmail(request, email, templateIdFarmerClaimLogin, redirectTo, farmerClaim)
}

module.exports = {
  sendFarmerClaimLoginMagicLink
}
