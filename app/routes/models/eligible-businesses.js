const applicationApi = require('../../api-requests/application-service-api')
const { hasClaimExpired } = require('../../lib/has-claim-expired')
const AGREED_STATUS = 1

async function processEligibleBusinesses (businessEmail) {
  const businesses = []
  const latestApplications = await applicationApi.getLatestApplicationsByEmail(businessEmail)
  if (latestApplications !== null && Array.isArray(latestApplications)) {
    latestApplications.forEach(latestApplication => {
      if (latestApplication.statusId === AGREED_STATUS) {
        if (hasClaimExpired(latestApplication)) {
          console.log(`${new Date().toISOString()} Time to claim for application has expired : ${JSON.stringify({
            sbi: latestApplication.data.organisation.sbi,
            reference: latestApplication.reference,
            agreementDate: latestApplication.createdAt
          })}`)
          latestApplication.expired = true
        } else {
          console.log(`${new Date().toISOString()} Latest application is eligible to claim : ${JSON.stringify({
            sbi: latestApplication.data.organisation.sbi,
            reference: latestApplication.reference
          })}`)
        }
        businesses.push(latestApplication)
      } else {
        console.log(`${new Date().toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi,
          reference: latestApplication.reference
        })}`)
      }
    })
  }
  return businesses.sort((a, b) => a.data.organisation.name.localeCompare(b.data.organisation.name))
}

module.exports = processEligibleBusinesses
