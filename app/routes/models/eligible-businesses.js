const applicationApi = require('../../api-requests/application-service-api')

async function processEligibleBusinesses (businessEmail) {
  const businesses = []
  const latestApplicationForSbi = await applicationApi.getLatestApplicationForEachSbi(businessEmail)
  if (latestApplicationForSbi !== null && Array.isArray(latestApplicationForSbi)) {
    latestApplicationForSbi.forEach(latestApplication => {
      if (latestApplication.statusId === 1) {
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
  return businesses
}

module.exports = processEligibleBusinesses