const applicationApi = require('../../api-requests/application-service-api')
const AGREED_STATUS = 1

async function processEligibleBusinesses (businessEmail) {
  const businesses = []
  const latestApplicationForSbi = await applicationApi.getLatestApplicationsBy(businessEmail)
  if (latestApplicationForSbi !== null && Array.isArray(latestApplicationForSbi)) {
    latestApplicationForSbi.forEach(latestApplication => {
      if (latestApplication.statusId === AGREED_STATUS) {
        console.log(`${new Date().toISOString()} Latest application is eligible to claim : ${JSON.stringify({
            sbi: latestApplication.data.organisation.sbi
          })}`)
        businesses.push(latestApplication)
      } else {
        console.log(`${new Date().toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
            sbi: latestApplication.data.organisation.sbi
        })}`)
      }
    })
  }
  return businesses.sort((a, b) => a.data.organisation.name.localeCompare(b.data.organisation.name))
}

module.exports = processEligibleBusinesses
