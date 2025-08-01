import { config } from '../config/index.js'
import {
  LAST_HOUR_OF_DAY,
  LAST_MILLISECOND_OF_SECOND,
  LAST_MINUTE_OF_HOUR,
  LAST_SECOND_OF_MINUTE
} from '../constants/constants.js'

export function hasClaimExpired (application) {
  const startDate = new Date(application.createdAt)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths)
  endDate.setHours(LAST_HOUR_OF_DAY, LAST_MINUTE_OF_HOUR, LAST_SECOND_OF_MINUTE, LAST_MILLISECOND_OF_SECOND) // set to midnight of the agreement end day
  return Date.now() > endDate.valueOf()
}
