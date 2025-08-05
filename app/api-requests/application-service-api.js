import Wreck from '@hapi/wreck'
import { config } from '../config/index.js'
import { StatusCodes } from 'http-status-codes'

export async function getAllApplicationsBySbi (sbi, logger) {
  const endpoint = `${config.applicationApiUri}/applications/latest?sbi=${sbi}`

  try {
    const { payload } = await Wreck.get(
      endpoint,
      { json: true }
    )

    return payload
  } catch (err) {
    if (err.output.statusCode === StatusCodes.NOT_FOUND) {
      return []
    }
    logger.setBindings({ err })
    throw err
  }
}

export const getHerds = async (applicationReference, typeOfLivestock, logger) => {
  const endpoint = `${config.applicationApiUri}/application/${applicationReference}/herds?species=${typeOfLivestock}`

  try {
    const { payload } = await Wreck.get(
      endpoint,
      { json: true }
    )
    return payload
  } catch (err) {
    if (err.output.statusCode === StatusCodes.NOT_FOUND) {
      return []
    }
    logger.setBindings({ err })
    throw err
  }
}
