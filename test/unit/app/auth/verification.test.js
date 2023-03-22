const { generateNonce, generateState, stateIsValid } = require('../../../../app/auth/verification')

describe('Verification functions test', () => {
  jest.mock('uuid', () => ({ v4: () => '123456789' }))

  test('when generateNonce token value set in session', async () => {
    const setTokenMock = jest.fn()
    const session = {
      setToken: setTokenMock
    }
    const result = generateNonce(session, undefined)
    expect(result).not.toBeNull()
    expect(setTokenMock).toHaveBeenCalledWith(undefined, 'nonce', result)
  })

  test('when generateState token value set in session', async () => {
    const setTokenMock = jest.fn()
    const session = {
      setToken: setTokenMock
    }
    const result = generateState(session, undefined)
    expect(result).not.toBeNull()
    expect(setTokenMock).toHaveBeenCalledWith(undefined, 'state', result)
  })

  test('when state is valid return true', async () => {
    const getTokenMock = jest.fn()
    const session = {
      getToken: getTokenMock
    }
    const request = {
      query: {
        state: 'something'
      }
    }
    getTokenMock.mockReturnValueOnce('something')
    const result = stateIsValid(session, request)
    expect(result).toBeTruthy()
    expect(getTokenMock).toHaveBeenCalledTimes(1)
  })

  test('when no state parameter return false', async () => {
    const getTokenMock = jest.fn()
    const session = {
      getToken: getTokenMock
    }
    const request = {
      query: {
        foo: 'bar'
      }
    }
    getTokenMock.mockReturnValueOnce('something')
    const result = stateIsValid(session, request)
    expect(result).toBeFalsy()
    expect(getTokenMock).toHaveBeenCalledTimes(0)
  })

  test('when state does not match session return false', async () => {
    const getTokenMock = jest.fn()
    const session = {
      getToken: getTokenMock
    }
    const request = {
      yar: {
        id: '2232'
      },
      query: {
        state: 'something'
      }
    }
    getTokenMock.mockReturnValueOnce('different')
    const result = stateIsValid(session, request)
    expect(result).toBeFalsy()
    expect(getTokenMock).toHaveBeenCalledTimes(1)
  })

  test('when query has error return false', async () => {
    const getTokenMock = jest.fn()
    const session = {
      getToken: getTokenMock
    }
    const request = {
      yar: {
        id: '2232'
      },
      query: {
        error: 'something'
      }
    }
    getTokenMock.mockReturnValueOnce('different')
    const result = stateIsValid(session, request)
    expect(result).toBeFalsy()
    expect(getTokenMock).toHaveBeenCalledTimes(0)
  })
})
