const Joi = require('joi')

const isDayEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-day`] === ''
const isMonthEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-month`] === ''

const validateDateInputYear = (namePrefix, whateverItIs, customValidation, customMessages) => {
  return Joi.when(`${namePrefix}-year`, {
    switch: [
      {
        is: '',
        then: Joi.custom((value, helpers) => {
          if (isDayEmpty(helpers, namePrefix) && isMonthEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputYear.ifNothingIsEntered')
          }
          if (isDayEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputYear.ifTheDateIsIncomplete.dayAndYear')
          }
          if (isMonthEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputYear.ifTheDateIsIncomplete.monthAndYear')
          }
          return helpers.error('dateInputYear.ifTheDateIsIncomplete.year')
        }),
        otherwise: Joi.number()
          .min(2022)
          .max(2024)
          .required()
          .when('on-another-date-day', {
            is: Joi.number().required(),
            then: Joi.when('on-another-date-month', {
              is: Joi.number().required(),
              then: Joi.custom(customValidation)
            })
          })
      }
    ]
  }).messages({
    'number.base': `${whateverItIs} must be a real date`,
    'number.min': `${whateverItIs} must be a real date`,
    'number.max': `${whateverItIs} must be a real date`,
    'dateInputYear.ifNothingIsEntered': `Enter ${whateverItIs.toLowerCase()}`,
    'dateInputYear.ifTheDateIsIncomplete.dayAndYear': `${whateverItIs} must include a day and a year`,
    'dateInputYear.ifTheDateIsIncomplete.monthAndYear': `${whateverItIs} must include a month and a year`,
    'dateInputYear.ifTheDateIsIncomplete.year': `${whateverItIs} must include a year`,
    ...customMessages
  })
}

module.exports = validateDateInputYear
