const applicationApi = require('../../api-requests/application-service-api')
const applicationStatus = require('../../constants/application-status')
const { NoApplicationFound, ClaimHasAlreadyBeenMade } = require('../../exceptions')

async function getLatestApplicationForSbi (sbi, name = '') {
  const latestApplicationsForSbi = await applicationApi.getLatestApplicationsBySbi(sbi)
  if (!latestApplicationsForSbi || !Array.isArray(latestApplicationsForSbi) || latestApplicationsForSbi.length === 0) {
    throw new NoApplicationFound(
      `No application found for SBI - ${sbi}`,
      {
        sbi,
        name
      }
    )
  }
  const latestApplication = latestApplicationsForSbi.reduce((a, b) => {
    return new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
  })
  switch (latestApplication.statusId) {
    case applicationStatus.AGREED_STATUS:
      return latestApplication
    case applicationStatus.IN_CHECK:
    case applicationStatus.READY_TO_PAY:
    case applicationStatus.REJECTED:
      throw new ClaimHasAlreadyBeenMade(
        `Claim has already been made for SBI - ${sbi}`,
        {
          sbi,
          name
        }
      )
    default:
      throw new NoApplicationFound(
        `No claimable application found for SBI - ${sbi}`,
        {
          sbi,
          name
        }
      )
  }
}

module.exports = getLatestApplicationForSbi
