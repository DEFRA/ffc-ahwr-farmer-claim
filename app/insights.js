import appInsights from 'applicationinsights'

export function setup () {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup().start()
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    appInsights.defaultClient.context.tags[cloudRoleTag] = process.env.APPINSIGHTS_CLOUDROLE ?? 'ffc-ahwr-farmer-claim'
    return true
  }

  return false
}
