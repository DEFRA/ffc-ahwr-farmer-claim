const { visitDate: errorMessages } = require('../../../app/lib/error-messages')

function isDateInFuture (date) {
  return date > new Date()
}

/**
 * Checks if `dateToCompare` is not more than 365 days older than `date`.
 *
 * @param {Date} date.
 * @param {Date} dateToCompare against.
 *
 * @return {boolean} result of comparison.
 */
function isDateWithinYear (date, dateToCompare) {
  const yearAgo = new Date(date)
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  return dateToCompare < yearAgo
}

/**
 * Compares one date to another to check if it is before.
 *
 * @param {Date} date.
 * @param {Date} dateToCompare against.
 *
 * @return {boolean} result of comparison.
 */
function isDateBefore (date, dateToCompare) {
  const cloneDate = new Date(dateToCompare)
  cloneDate.setDate(cloneDate.getDate() - 1)
  return date < cloneDate
}

/**
 * Checks if the date is in the future or before `dateToCompare`.
 *
 * @param {Date} date representing the date of the review.
 * @param {Date} dateToCompare the date to compare against.
 *
 * @return {object} containing boolean `isDateValid` property and an optional
 * `errorMessage` property object containing `text` - a string representing the
  * error message.
 */
function isDateInFutureOrBeforeFirstValidDate (date, dateToCompare) {
  const futureDate = isDateInFuture(date)
  if (futureDate || isDateBefore(date, dateToCompare) || isDateWithinYear(date, dateToCompare)) {
    return {
      errorMessage: {
        text: futureDate ? errorMessages.todayOrPast : errorMessages.startDateOrAfter(dateToCompare)
      },
      isDateValid: false
    }
  }
  return {
    isDateValid: true
  }
}

module.exports = {
  isDateInFutureOrBeforeFirstValidDate
}
