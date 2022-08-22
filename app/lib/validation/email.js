const Joi = require('joi')
const { email: emailErrorMessages } = require('../error-messages')

module.exports = {
  email: Joi.string().trim().email().required()
    .messages({
      'any.required': emailErrorMessages.enterEmail,
      'string.base': emailErrorMessages.enterEmail,
      'string.email': emailErrorMessages.validEmail,
      'string.empty': emailErrorMessages.enterEmail
    })
}
