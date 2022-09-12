const { inputErrorClass, labelPrefix } = require('../../config/visit-date')

function getValue (date, period) {
  switch (period) {
    case 'day':
      return date.getDate()
    case 'month':
      return date.getMonth() + 1
    case 'year':
      return date.getFullYear()
  }
}

function createItemsFromDate (date, includeErrorClass) {
  const items = [{
    name: 'day',
    classes: 'govuk-input--width-2'
  }, {
    name: 'month',
    classes: 'govuk-input--width-2'
  }, {
    name: 'year',
    classes: 'govuk-input--width-4'
  }]

  items.forEach(item => {
    item.value = getValue(date, item.name)
    item.classes += includeErrorClass ? ` ${inputErrorClass}` : ''
  })
  return items
}

function createItemsFromPayload (payload, includeErrorClass) {
  const items = [{
    name: 'day',
    classes: 'govuk-input--width-2'
  }, {
    name: 'month',
    classes: 'govuk-input--width-2'
  }, {
    name: 'year',
    classes: 'govuk-input--width-4'
  }]

  items.forEach(item => {
    item.value = payload?.[`${labelPrefix}${item.name}`]
    item.classes += includeErrorClass ? ` ${inputErrorClass}` : ''
  })
  return items
}

module.exports = {
  createItemsFromDate,
  createItemsFromPayload
}
