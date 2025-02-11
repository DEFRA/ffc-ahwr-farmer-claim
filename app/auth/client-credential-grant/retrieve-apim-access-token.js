import wreck from '@hapi/wreck'
import FormData from 'form-data'
import { authConfig } from '../../config/auth.js'
import { config } from '../../config/index.js'

export const retrieveApimAccessToken = async (request) => {
  const endpoint = `${authConfig.apim.hostname}${authConfig.apim.oAuthPath}`
  try {
    const data = new FormData()
    data.append('client_id', `${authConfig.apim.clientId}`)
    data.append('client_secret', `${authConfig.apim.clientSecret}`)
    data.append('scope', `${authConfig.apim.scope}`)
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
