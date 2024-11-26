const { updateContactHistory } = require('../../../../app/api-requests/contact-history-api')
const wreck = require('@hapi/wreck')
const config = require('../../../../app/config')

jest.mock('@hapi/wreck')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

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

    wreck.put.mockResolvedValueOnce({
      res: {
        statusCode: 200
      },
      payload: {
        success: true
      }
    })

    const logger = { setBindings: jest.fn() }

    await updateContactHistory(data, logger)

    expect(wreck.put).toHaveBeenCalledWith(`${mockConfig.applicationApiUri}/application/contact-history`, {
      payload: data,
      json: true
    })
  })

  test('throws an error on non-200 response', async () => {
    const data = {
      email: 'test@example.com'
    }

    const response = {
      res: {
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      }
    }

    wreck.put.mockRejectedValueOnce(response)

    const logger = { setBindings: jest.fn() }

    expect(async () => {
      await updateContactHistory(data, logger)
    }).rejects.toEqual(response)
  })

  test('returns the response payload on success', async () => {
    const data = {
      email: 'test@example.com'
    }

    const responsePayload = {
      success: true
    }

    wreck.put.mockResolvedValueOnce({
      res: {
        statusCode: 200
      },
      payload: responsePayload
    })

    const logger = { setBindings: jest.fn() }

    const result = await updateContactHistory(data, logger)

    expect(result).toEqual(responsePayload)
  })
})
