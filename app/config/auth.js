const Joi = require('joi')

const authSchema = Joi.object({
  defraId: {
    enabled: Joi.bool().default(false),
    hostname: Joi.string().uri(),
    oAuthAuthorisePath: Joi.string(),
    policy: Joi.string(),
    redirectUri: Joi.string().uri(),
    clientId: Joi.string(),
    serviceId: Joi.string(),
    scope: Joi.string()
  }
})

const authConfig = {
  defraId: {
    enabled: process.env.DEFRA_ID_ENABLED,
    hostname: `https://${process.env.DEFRA_ID_TENANT}.b2clogin.com/${process.env.DEFRA_ID_TENANT}.onmicrosoft.com`,
    oAuthAuthorisePath: '/oauth2/v2.0/authorize',
    policy: process.env.DEFRA_ID_POLICY,
    redirectUri: process.env.DEFRA_ID_REDIRECT_URI,
    clientId: process.env.DEFRA_ID_CLIENT_ID,
    serviceId: process.env.DEFRA_ID_SERVICE_ID,
    scope: `openid ${process.env.DEFRA_ID_CLIENT_ID} offline_access`
  }
}

const authResult = authSchema.validate(authConfig, {
  abortEarly: false
})

if (authResult.error) {
  console.log(authResult.error.message)
  throw new Error(`The auth config is invalid. ${authResult.error.message}`)
}

module.exports = authResult.value
