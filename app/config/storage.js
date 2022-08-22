const Joi = require('joi')

const storageSchema = Joi.object({
  connectionString: Joi.string().required(),
  usersContainer: Joi.string().default('users'),
  usersFile: Joi.string().default('users.json'),
  storageAccount: Joi.string().required(),
  useConnectionString: Joi.bool().default(true)
})

const storageConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  usersContainer: process.env.AZURE_STORAGE_USERS_CONTAINER
}

const storageResult = storageSchema.validate(storageConfig, {
  abortEarly: false
})

if (storageResult.error) {
  throw new Error(`The storage config is invalid. ${storageResult.error.message}`)
}

module.exports = storageResult.value
