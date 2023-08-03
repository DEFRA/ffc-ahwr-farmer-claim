const Joi = require('joi')

const isDayEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-day`] === ''
const isYearEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-year`] === ''

const validateDateInputMonth = (namePrefix, dateName) => {
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
    'number.base': `${dateName} must be a real date`,
    'number.min': `${dateName} must be a real date`,
    'number.max': `${dateName} must be a real date`,
    'dateInputMonth.ifNothingIsEntered': `Enter ${dateName.toLowerCase()}`,
    'dateInputMonth.ifTheDateIsIncomplete.dayAndMonth': `${dateName} must include a day and a month`,
    'dateInputMonth.ifTheDateIsIncomplete.monthAndYear': `${dateName} must include a month and a year`,
    'dateInputMonth.ifTheDateIsIncomplete.month': `${dateName} must include a month`
  })
}

module.exports = validateDateInputMonth
