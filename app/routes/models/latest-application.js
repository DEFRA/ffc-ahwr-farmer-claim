const applicationApi = require('../../api-requests/application-service-api')
const { NoApplicationFound, ClaimHasAlreadyBeenMade } = require('../../exceptions')

const AGREED_STATUS = 1

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
  if (latestApplication.claimed) {
    throw new ClaimHasAlreadyBeenMade(
      `Claim has already been made for SBI - ${sbi}`,
      {
        sbi,
        name
      }
    )
  }
  if (latestApplication.statusId !== AGREED_STATUS) {
    throw new NoApplicationFound(
      `No claimable application found for SBI - ${sbi}`,
      {
        sbi,
        name
      }
    )
  }
  return latestApplication
}

module.exports = getLatestApplicationForSbi
