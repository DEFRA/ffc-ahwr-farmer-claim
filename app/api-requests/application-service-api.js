const Wreck = require('@hapi/wreck')
const config = require('../config')

async function getAllApplicationsBySbi (sbi, logger) {
  const endpoint = `${config.applicationApiUri}/applications/latest?sbi=${sbi}`

  try {
    const { payload } = await Wreck.get(
      endpoint,
      { json: true }
    )

    return payload
  } catch (err) {
    if (err.output.statusCode === 404) {
      return []
    }
    logger.setBindings({ err })
    throw err
  }
}

module.exports = {
  getAllApplicationsBySbi
}
