const wreck = require('@hapi/wreck')
const session = require('../../session')
const { tokens } = require('../../session/keys')
const config = require('../../config')
const apiHeaders = require('../../constants/api-headers')

const get = async (hostname, url, request, headers = {}) => {
  const token = session.getToken(request, tokens.accessToken)
  headers[apiHeaders.xForwardedAuthorization] = token
  headers[apiHeaders.ocpSubscriptionKey] = config.authConfig.apim.ocpSubscriptionKey
  console.log(`${new Date().toISOString()} Request message to RPA: ${JSON.stringify(`${hostname}${url}`)}`)

  try {
    const response = await wreck.get(`${hostname}${url}`,
      {
        headers,
        json: true,
        rejectUnauthorized: false,
        timeout: config.wreckHttp.timeoutMilliseconds
      })

    console.log(`${new Date().toISOString()} Response status code from RPA: ${JSON.stringify(response.res.statusCode)}`)
    return response?.payload
  } catch (error) {
    console.log(`${new Date().toISOString()} Response message from RPA: ${JSON.stringify(error.message)}`)
    console.error(error)
    throw error
  }
}

module.exports = {
  get
}
