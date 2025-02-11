import Wreck from '@hapi/wreck'
import { config } from '../config/index.js'

export async function getAllApplicationsBySbi (sbi, logger) {
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
