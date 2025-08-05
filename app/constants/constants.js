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

export const MAX_POSSIBLE_YEAR = 9999
export const MIN_POSSIBLE_YEAR = 1000 // there's an argument to be had that this should be 2018 or something more sensible
export const MAX_POSSIBLE_DAY = 31
export const MAX_POSSIBLE_DAY_SHORT_MONTHS = 30
export const MAX_POSSIBLE_DAY_FEB_LEAP_YEAR = 29
export const MAX_POSSIBLE_DAY_FEB = 28
export const MAX_POSSIBLE_MONTH = 12
const APRIL_INDEX = 4
const JUNE_INDEX = 6
const SEPTEMBER_INDEX = 9
const NOVEMBER_INDEX = 11
export const SHORT_MONTHS = [APRIL_INDEX, JUNE_INDEX, SEPTEMBER_INDEX, NOVEMBER_INDEX]
