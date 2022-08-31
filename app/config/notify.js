const Joi = require('joi')
const uuidRegex = require('./uuid-regex')
const notifyApiKeyRegex = new RegExp(`.*-${uuidRegex}-${uuidRegex}`)

const notifySchema = Joi.object({
  apiKey: Joi.string().pattern(notifyApiKeyRegex),
  templateIdFarmerClaimLogin: Joi.string().uuid(),
  testToken: Joi.string().uuid().optional()
})

const notifyConfig = {
  apiKey: process.env.NOTIFY_API_KEY,
  templateIdFarmerClaimLogin: process.env.NOTIFY_TEMPLATE_ID_FARMER_CLAIM_LOGIN,
  testToken: process.env.TEST_TOKEN
}
const notifyResult = notifySchema.validate(notifyConfig, {
  abortEarly: false
})

if (notifyResult.error) {
  throw new Error(`The notify config is invalid. ${notifyResult.error.message}`)
}

module.exports = notifyResult.value
