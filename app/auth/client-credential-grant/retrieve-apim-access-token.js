const wreck = require('@hapi/wreck')
const FormData = require('form-data')
const config = require('../../config')

const retrieveApimAccessToken = async (request) => {
  const endpoint = `${config.authConfig.apim.hostname}${config.authConfig.apim.oAuthPath}`
  try {
    const data = new FormData()
    data.append('client_id', `${config.authConfig.apim.clientId}`)
    data.append('client_secret', `${config.authConfig.apim.clientSecret}`)
    data.append('scope', `${config.authConfig.apim.scope}`)
    data.append('grant_type', 'client_credentials')

    const response = await wreck.post(
      endpoint,
      {
        headers: data.getHeaders(),
        payload: data,
        json: true,
        timeout: config.wreckHttp.timeoutMilliseconds
      }
    )

    return `${response?.payload.token_type} ${response?.payload.access_token}`
  } catch (err) {
    request.logger.setBindings({ endpoint })
    throw err
  }
}

module.exports = retrieveApimAccessToken
