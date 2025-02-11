import Joi from 'joi'

const isDayEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-day`] === ''
const isMonthEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-month`] === ''

export const validateDateInputYear = (namePrefix, dateName, customValidation, customMessages) => {
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
          .min(1000)
          .max(9999)
          .required()
          .when(`${namePrefix}-day`, {
            is: Joi.number().required(),
            then: Joi.when(`${namePrefix}-month`, {
              is: Joi.number().required(),
              then: Joi.custom(customValidation)
            })
          })
      }
    ]
  }).messages({
    'number.min': 'Year must include 4 numbers',
    'number.max': 'Year must include 4 numbers',
    'dateInputYear.ifNothingIsEntered': `Enter ${dateName.toLowerCase()}`,
    'dateInputYear.ifTheDateIsIncomplete.dayAndYear': `${dateName} must include a day and a year`,
    'dateInputYear.ifTheDateIsIncomplete.monthAndYear': `${dateName} must include a month and a year`,
    'dateInputYear.ifTheDateIsIncomplete.year': `${dateName} must include a year`,
    ...customMessages
  })
}
