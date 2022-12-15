const Wreck = require('@hapi/wreck')
const mockConfig = require('../../../../app/config')

jest.mock('@hapi/wreck')

const consoleLogSpy = jest.spyOn(console, 'log')
const consoleErrorSpy = jest.spyOn(console, 'error')

const mockEligibilityApiUri = 'http://internal:3333/api'

describe('Eligibility API', () => {
  let eligibilityApi

  beforeAll(() => {
    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      eligibilityApiUri: mockEligibilityApiUri
    }))
    eligibilityApi = require('../../../../app/api-requests/eligibility-service')
  })

  afterAll(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  describe('getEligibleUserByEmail', () => {
    test('given an eligible business email address it returns an object containing a user data', async () => {
      const expectedResponse = {
        payload: {
          farmerName: 'David Smith',
          name: 'David\'s Farm',
          sbi: '441111114',
          cph: '44/333/1112',
          address: 'Some Road, London, MK55 7ES',
          email: 'name@email.com'
        },
        res: {
          statusCode: 200
        }
      }
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)

      const response = await eligibilityApi.getEligibleUserByEmail(BUSINESS_EMAIL_ADDRESS)

      expect(response).not.toBeNull()
      expect(response.farmerName).toStrictEqual(expectedResponse.payload.farmerName)
      expect(response.name).toStrictEqual(expectedResponse.payload.name)
      expect(response.sbi).toStrictEqual(expectedResponse.payload.sbi)
      expect(response.cph).toStrictEqual(expectedResponse.payload.cph)
      expect(response.address).toStrictEqual(expectedResponse.payload.address)
      expect(response.email).toStrictEqual(expectedResponse.payload.email)
      expect(Wreck.get).toHaveBeenCalledTimes(1)
      expect(Wreck.get).toHaveBeenCalledWith(
          `${mockEligibilityApiUri}/eligibility?emailAddress=${BUSINESS_EMAIL_ADDRESS}`,
          options
      )
    })

    test('given Wreck.get returns 400 it logs the issue and returns null', async () => {
      const statusCode = 400
      const statusMessage = 'A valid email address must be specified.'
      const expectedResponse = {
        payload: {
          statusCode,
          error: 'Bad Request',
          message: 'A valid email address must be specified.'
        },
        res: {
          statusCode,
          statusMessage
        }
      }
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)

      const response = await eligibilityApi.getEligibleUserByEmail(BUSINESS_EMAIL_ADDRESS)

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`Bad response: ${statusCode} - ${statusMessage}`)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockEligibilityApiUri}/eligibility?emailAddress=${BUSINESS_EMAIL_ADDRESS}`,
        options
      )
    })

    test('given Wreck.get throws an error it logs the error and returns null', async () => {
      const expectedError = new Error('msg')
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockRejectedValue(expectedError)

      const response = await eligibilityApi.getEligibleUserByEmail(BUSINESS_EMAIL_ADDRESS)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(`eligiblityApiUri.getEligibleUserByEmail failed: ${expectedError.message}`)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockEligibilityApiUri}/eligibility?emailAddress=${BUSINESS_EMAIL_ADDRESS}`,
        options
      )
    })
  })
})
