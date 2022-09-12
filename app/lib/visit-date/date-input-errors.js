const { createItemsFromPayload } = require('./date-input-items')
const { isDateInFutureOrBeforeFirstValidDate } = require('./validation')
const { inputErrorClass, labels } = require('../../config/visit-date')
const { visitDate: errorMessages } = require('../../../app/lib/error-messages')

function getEmptyValuesMessage (emptyValues) {
  let text
  if (emptyValues.length === 3) {
    text = errorMessages.enterDate
  } else if (emptyValues.length === 2) {
    emptyValues.sort()
    text = errorMessages.emptyValues(emptyValues[0], emptyValues[1])
  } else if (emptyValues.length === 1) {
    text = errorMessages.emptyValues(emptyValues[0])
  }
  return text
}

function getDateFromPayload (payload) {
  const day = payload[labels.day]
  const month = payload[labels.month]
  const year = payload[labels.year]
  return new Date(year, month - 1, day)
}

/**
 * Generates the text input items for a govukDateInput along with an error
 * message, based on the reason why the validation failed.
 * Returns an object containing two properties, `errorMessage` (an object
 * containing a `text` property) and `items` (an array of input items).
 *
 * @param {object} errorDetails Joi result object containing details of the
 * error the payload failed for.
 * @param {object} payload from the request that failed the validation.
 * @param {Date} firstValidDate representing first valid date.
 */
module.exports = (errorDetails, payload, firstValidDate) => {
  const date = getDateFromPayload(payload)
  const items = createItemsFromPayload(payload, false)

  const emptyValues = []
  errorDetails.forEach(err => {
    const item = items.find(x => x.name === err.context.label.split('-').pop())
    item.classes += ` ${inputErrorClass}`
    if (item.value === '') {
      emptyValues.push(item.name)
    }
  })

  let text = getEmptyValuesMessage(emptyValues)
  if (!text) {
    const { isDateValid, errorMessage } = isDateInFutureOrBeforeFirstValidDate(date, firstValidDate)
    if (isDateValid) {
      text = errorMessages.realDate
    } else {
      text = errorMessage.text
      items.forEach(item => {
        item.classes += ` ${inputErrorClass}`
      })
    }
  }

  return {
    errorMessage: { text },
    items
  }
}
