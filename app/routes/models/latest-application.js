const applicationApi = require('../../api-requests/application-service-api')
const AGREED_STATUS = 1

async function getLatestApplicationForSbi (sbi) {
    const latestApplicationsForSbi = await applicationApi.getLatestApplicationsBySbi(sbi)
    if (latestApplicationsForSbi && Array.isArray(latestApplicationsForSbi) && latestApplicationsForSbi.length > 0) {
      const latestApplication = latestApplicationsForSbi.reduce((a, b) => {
        return new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
      })
      return applicationIsInAgreedStatus(latestApplication)
    } else {
        return null
    }
}

function applicationIsInAgreedStatus(latestApplication) {
  if (latestApplication.statusId === AGREED_STATUS) {
    console.log(`${new Date().toISOString()} Latest application is eligible to claim : ${JSON.stringify({
        sbi: latestApplication.data.organisation.sbi
      })}`)
    return latestApplication
  } else {
    console.log(`${new Date().toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
        sbi: latestApplication.data.organisation.sbi
    })}`)
    return null
  }
}

module.exports = getLatestApplicationForSbi