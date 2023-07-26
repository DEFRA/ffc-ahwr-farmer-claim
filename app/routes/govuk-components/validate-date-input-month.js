const Joi = require('joi')

const isDayEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-day`] === ''
const isYearEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-year`] === ''

const validateDateInputMonth = (namePrefix, whateverItIs) => {
  return Joi.when(`${namePrefix}-month`, {
    switch: [
      {
        is: '',
        then: Joi.custom((value, helpers) => {
          if (isDayEmpty(helpers, namePrefix) && isYearEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputMonth.ifNothingIsEntered')
          }
          if (isDayEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputMonth.ifTheDateIsIncomplete.dayAndMonth')
          }
          if (isYearEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputMonth.ifTheDateIsIncomplete.monthAndYear')
          }
          return helpers.error('dateInputMonth.ifTheDateIsIncomplete.month')
        }),
        otherwise: Joi
          .number()
          .min(1)
          .max(12)
          .required()
      }
    ]
  }).messages({
    'number.base': `${whateverItIs} must be a real date`,
    'number.min': `${whateverItIs} must be a real date`,
    'number.max': `${whateverItIs} must be a real date`,
    'dateInputMonth.ifNothingIsEntered': `Enter ${whateverItIs.toLowerCase()}`,
    'dateInputMonth.ifTheDateIsIncomplete.dayAndMonth': `${whateverItIs} must include a day and a month`,
    'dateInputMonth.ifTheDateIsIncomplete.monthAndYear': `${whateverItIs} must include a month and a year`,
    'dateInputMonth.ifTheDateIsIncomplete.month': `${whateverItIs} must include a month`
  })
}

module.exports = validateDateInputMonth
