import { config } from '../config/index.js'

export const status = {
  AGREED: 1,
  WITHDRAWN: 2,
  IN_CHECK: 5,
  ACCEPTED: 6,
  NOT_AGREED: 7,
  PAID: 8,
  READY_TO_PAY: 9,
  REJECTED: 10,
  ON_HOLD: 11
}

export const ONLY_HERD = 'onlyHerd'

export const ONLY_HERD_ON_SBI = {
  YES: 'yes',
  NO: 'no'
}

export const MULTIPLE_SPECIES_RELEASE_DATE = new Date('2025-02-26T00:00:00')

export const MULTIPLE_HERDS_RELEASE_DATE = new Date(config.multiHerds.releaseDate)

export const PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE = new Date('2025-01-21T00:00:00')

export const LAST_HOUR_OF_DAY = 23
export const LAST_MINUTE_OF_HOUR = 59
export const LAST_SECOND_OF_MINUTE = 59
export const LAST_MILLISECOND_OF_SECOND = 999
