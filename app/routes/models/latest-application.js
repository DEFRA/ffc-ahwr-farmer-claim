const applicationApi = require('../../api-requests/application-service-api')
const applicationStatus = require('../../constants/status')
const { claimHasExpired } = require('../../lib/claim-has-expired')
const { NoApplicationFoundError, ClaimHasAlreadyBeenMadeError, ClaimHasExpiredError } = require('../../exceptions')
const { claimExpiryTimeMonths } = require('../../config')

function formatDate (date) {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

function claimTimeLimitDates (latestApplication) {
  const start = new Date(latestApplication.createdAt)
  const end = new Date(start)
  end.setMonth(end.getMonth() + claimExpiryTimeMonths)
  end.setHours(24, 0, 0, 0) // set to midnight of agreement end day
  return { startDate: start, endDate: end }
}

async function getLatestApplicationForSbi (sbi, name = '') {
  const latestApplicationsForSbi = await applicationApi.getLatestApplicationsBySbi(sbi)

  if (!latestApplicationsForSbi || !Array.isArray(latestApplicationsForSbi) || latestApplicationsForSbi.length === 0) {
    throw new NoApplicationFoundError(
      `No application found for SBI - ${sbi}`,
      {
        sbi,
        name
      }
    )
  }
  const latestApplication = latestApplicationsForSbi.reduce((a, b) => {
    return new Date(a.createdAt) > new Date(b.createdAt) ? a : b
  })
  switch (latestApplication.statusId) {
    case applicationStatus.AGREED:
      if (claimHasExpired(latestApplication)) {
        const dates = claimTimeLimitDates(latestApplication)
        throw new ClaimHasExpiredError(`Claim has expired for reference - ${latestApplication.reference}`,
          {
            sbi,
            name,
            reference: latestApplication.reference
          },
          formatDate(dates.startDate),
          formatDate(dates.endDate)
        )
      }
      return latestApplication
    case applicationStatus.IN_CHECK:
    case applicationStatus.ON_HOLD:
    case applicationStatus.READY_TO_PAY:
    case applicationStatus.REJECTED:
      throw new ClaimHasAlreadyBeenMadeError(
        `Claim has already been made for SBI - ${sbi}`,
        {
          sbi,
          name,
          reference: latestApplication.reference
        }
      )
    default:
      throw new NoApplicationFoundError(
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
