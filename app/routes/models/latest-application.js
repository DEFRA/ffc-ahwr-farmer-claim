const applicationApi = require('../../api-requests/application-service-api')
const applicationStatus = require('../../constants/application-status')
const { claimHasExpired } = require('../../lib/claim-has-expired')
const { NoApplicationFound, ClaimHasAlreadyBeenMade, ClaimHasExpired } = require('../../exceptions')

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
      if (claimHasExpired(latestApplication)) {
        throw new ClaimHasExpired(`Claim has expired for reference - ${latestApplication.reference}`,
          {
            sbi,
            name,
            reference: latestApplication.reference
          }
        )
      }
      return latestApplication
    case applicationStatus.IN_CHECK:
    case applicationStatus.READY_TO_PAY:
    case applicationStatus.REJECTED:
      throw new ClaimHasAlreadyBeenMade(
        `Claim has already been made for SBI - ${sbi}`,
        {
          sbi,
          name,
          reference: latestApplication.reference
        }
      )
    default:
      throw new NoApplicationFound(
        `No claimable application found for SBI - ${sbi}`,
        {
          sbi,
          name,
          reference: latestApplication.reference
        }
      )
  }
}

module.exports = getLatestApplicationForSbi
