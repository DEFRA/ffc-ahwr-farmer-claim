const Joi = require('joi')

const authSchema = Joi.object({
  defraId: {
    hostname: Joi.string().uri(),
    oAuthAuthorisePath: Joi.string(),
    policy: Joi.string(),
    redirectUri: Joi.string().uri(),
    dashboardRedirectUri: Joi.string().uri(),
    tenantName: Joi.string(),
    clientId: Joi.string(),
    clientSecret: Joi.string(),
    jwtIssuerId: Joi.string(),
    serviceId: Joi.string(),
    scope: Joi.string()
  },
  ruralPaymentsAgency: {
    hostname: Joi.string(),
    getPersonSummaryUrl: Joi.string(),
    getOrganisationPermissionsUrl: Joi.string(),
    getOrganisationUrl: Joi.string()
  },
  apim: {
    hostname: Joi.string(),
    oAuthPath: Joi.string(),
    clientId: Joi.string(),
    clientSecret: Joi.string(),
    scope: Joi.string(),
    ocpSubscriptionKey: Joi.string()
  }
})

const authConfig = {
  defraId: {
    hostname: `https://${process.env.DEFRA_ID_TENANT}.b2clogin.com/${process.env.DEFRA_ID_TENANT}.onmicrosoft.com`,
    oAuthAuthorisePath: '/oauth2/v2.0/authorize',
    policy: process.env.DEFRA_ID_POLICY,
    redirectUri: process.env.DEFRA_ID_REDIRECT_URI,
    dashboardRedirectUri: process.env.DEFRA_ID_DASHBOARD_REDIRECT_URI,
    tenantName: process.env.DEFRA_ID_TENANT,
    clientId: process.env.DEFRA_ID_CLIENT_ID,
    clientSecret: process.env.DEFRA_ID_CLIENT_SECRET,
    jwtIssuerId: process.env.DEFRA_ID_JWT_ISSUER_ID,
    serviceId: process.env.DEFRA_ID_SERVICE_ID,
    scope: `openid ${process.env.DEFRA_ID_CLIENT_ID} offline_access`
  },
  ruralPaymentsAgency: {
    hostname: process.env.RPA_HOST_NAME,
    getPersonSummaryUrl: process.env.RPA_GET_PERSON_SUMMARY_URL,
    getOrganisationPermissionsUrl: process.env.RPA_GET_ORGANISATION_PERMISSIONS_URL,
    getOrganisationUrl: process.env.RPA_GET_ORGANISATION_URL
  },
  apim: {
    hostname: process.env.APIM_HOST_NAME,
    oAuthPath: process.env.APIM_OAUTH_PATH,
    clientId: process.env.APIM_CLIENT_ID,
    clientSecret: process.env.APIM_CLIENT_SECRET,
    scope: process.env.APIM_SCOPE,
    ocpSubscriptionKey: process.env.APIM_OCP_SUBSCRIPTION_KEY
  }
}

const authResult = authSchema.validate(authConfig, {
  abortEarly: false
})

if (authResult.error) {
  console.log(authResult.error.message)
  throw new Error(`The auth config is invalid. ${authResult.error.message}`)
}

module.exports = authConfig
