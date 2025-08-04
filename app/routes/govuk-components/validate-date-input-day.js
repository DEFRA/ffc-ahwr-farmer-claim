import Joi from 'joi'
import { MAX_POSSIBLE_DAY, MAX_POSSIBLE_DAY_SHORT_MONTHS, SHORT_MONTHS } from '../../constants/constants.js'

const isYearEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-year`] === ''
const isMonthEmpty = (helpers, namePrefix) => helpers.state.ancestors[0][`${namePrefix}-month`] === ''
const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

export const validateDateInputDay = (namePrefix, dateName) => {
  return Joi.when(`${namePrefix}-day`, {
    switch: [
      {
        is: '',
        then: Joi.custom((_value, helpers) => {
          if (isYearEmpty(helpers, namePrefix) && isMonthEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputDay.ifNothingIsEntered')
          }
          if (isYearEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputDay.ifTheDateIsIncomplete.dayAndYear')
          }
          if (isMonthEmpty(helpers, namePrefix)) {
            return helpers.error('dateInputDay.ifTheDateIsIncomplete.dayAndMonth')
          }
          return helpers.error('dateInputDay.ifTheDateIsIncomplete.day')
        }),
        otherwise: Joi.number().min(1).when(`${namePrefix}-month`, {
          switch: [
            {
              is: Joi.number().valid(2),
              then: Joi.number().custom((value, helpers) => {
                const year = helpers.state.ancestors[0][`${namePrefix}-year`]
                const isValidDay = isLeapYear(year) ? value <= 29 : value <= 28
                return isValidDay ? value : helpers.error('dateInputDay.ifTheDateEnteredCannotBeCorrect')
              })
            },
            {
              is: Joi.number().valid(...SHORT_MONTHS),
              then: Joi.number().max(MAX_POSSIBLE_DAY_SHORT_MONTHS),
              otherwise: Joi.number().max(MAX_POSSIBLE_DAY)
            }
          ]
        }).required()
      }
    ]
  }).messages({
    'number.base': `${dateName} must be a real date`,
    'number.min': `${dateName} must be a real date`,
    'number.max': `${dateName} must be a real date`,
    'dateInputDay.ifTheDateEnteredCannotBeCorrect': `${dateName} must be a real date`,
    'dateInputDay.ifTheDateIsIncomplete.dayAndYear': `${dateName} must include a day and a year`,
    'dateInputDay.ifTheDateIsIncomplete.dayAndMonth': `${dateName} must include a day and a month`,
    'dateInputDay.ifTheDateIsIncomplete.day': `${dateName} must include a day`
  })
}
