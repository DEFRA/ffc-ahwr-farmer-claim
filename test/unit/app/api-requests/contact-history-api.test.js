const { updateContactHistory } = require('../../../../app/api-requests/contact-history-api')
const Wreck = require('@hapi/wreck')
const config = require('../../../../app/config')

jest.mock('@hapi/wreck')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
const consoleErrorSpy = jest.spyOn(console, 'error')

describe('updateContactHistory', () => {
  const mockConfig = {
    applicationApiUri: config.applicationApiUri
  }

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('makes a PUT request to the contact history endpoint', async () => {
    const data = {
      email: 'test@example.com',
      sbi: '123',
      address: {
        addressLine1: '1 Test Street'
      },
      user: 'admin'
    }

    Wreck.put.mockResolvedValueOnce({
      res: {
        statusCode: 200
      },
      payload: {
        success: true
      }
    })

    await updateContactHistory(data, mockConfig)

    expect(Wreck.put).toHaveBeenCalledWith(`${mockConfig.applicationApiUri}/application/contact-history`, {
      payload: data,
      json: true
    })
  })

  test('throws an error on non-200 response', async () => {
    const data = {
      email: 'test@example.com'
    }

    Wreck.put.mockResolvedValueOnce({
      res: {
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      }
    })
    const result = await updateContactHistory(data, mockConfig)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(result).toBe(null)
  })

  test('returns the response payload on success', async () => {
    const data = {
      email: 'test@example.com'
    }

    const responsePayload = {
      success: true
    }

    Wreck.put.mockResolvedValueOnce({
      res: {
        statusCode: 200
      },
      payload: responsePayload
    })

    const result = await updateContactHistory(data, mockConfig)

    expect(result).toEqual(responsePayload)
  })
})
