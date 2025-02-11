import { getLatestApplication } from '../../lib/get-latest-application.js'
import { getAllApplicationsBySbi } from '../../api-requests/application-service-api.js'
import { status as applicationStatus } from '../../constants/constants.js'
import { claimHasExpired } from '../../lib/claim-has-expired.js'
import { NoApplicationFoundError } from '../../exceptions/no-application-found.js'
import { ClaimHasAlreadyBeenMadeError } from '../../exceptions/claim-has-already-been-made.js'
import { ClaimHasExpiredError } from '../../exceptions/claim-has-expired.js'
import { config } from '../../config/index.js'

const { claimExpiryTimeMonths } = config

function formatDate (date) {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

function claimTimeLimitDates (latestApplication) {
  const start = new Date(latestApplication.createdAt)
  const end = new Date(start)
  end.setMonth(end.getMonth() + claimExpiryTimeMonths)
  end.setHours(23, 59, 59, 999) // set to midnight of the agreement end day
  return { startDate: start, endDate: end }
}

export async function getLatestApplicationForSbi (sbi, name = '') {
  const latestApplicationsForSbi = await getAllApplicationsBySbi(sbi)

  if (!latestApplicationsForSbi || !Array.isArray(latestApplicationsForSbi) || latestApplicationsForSbi.length === 0) {
    throw new NoApplicationFoundError(
      `No application found for SBI - ${sbi}`,
      {
        sbi,
        name
      }
    )
  }
  const latestApplication = getLatestApplication(latestApplicationsForSbi)
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
