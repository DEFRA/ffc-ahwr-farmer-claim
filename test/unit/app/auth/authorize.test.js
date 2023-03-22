let auth

describe('Generate authentication url test', () => {
  let sessionMock
  let verificationMock

  beforeAll(() => {
    jest.resetModules()

    sessionMock = require('../../../../app/session')
    jest.mock('../../../../app/session')

    verificationMock = require('../../../../app/auth/verification')
    jest.mock('../../../../app/auth/verification')

    auth = require('../../../../app/auth')
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('when getAuthenticationUrl with pkce true challenge parameter added', async () => {
    const setPkcecodesMock = jest.fn()
    const setTokenMock = jest.fn()
    const session = {
      setPkcecodes: setPkcecodesMock,
      setToken: setTokenMock
    }
    const result = auth.getAuthenticationUrl(session, undefined)
    const params = new URL(result).searchParams
    expect(params.get('code_challenge')).not.toBeNull()
  })

  test('when getAuthenticationUrl with pkce false no challenge parameter is added', async () => {
    const setPkcecodesMock = jest.fn()
    const setTokenMock = jest.fn()
    const session = {
      setPkcecodes: setPkcecodesMock,
      setToken: setTokenMock
    }
    const result = auth.getAuthenticationUrl(session, undefined, false)
    const params = new URL(result).searchParams
    expect(params.get('code_challenge')).toBeNull()
  })

  test('when authenticate successfull returns access token', async () => {
    verificationMock.stateIsValid.mockReturnValueOnce(true)
    const result = await auth.authenticate({}, sessionMock)
    expect(result).toEqual('dummy_access_token')
  })

  test('when invalid state error is thrown', async () => {
    verificationMock.stateIsValid.mockReturnValueOnce(false)
    try {
      await auth.authenticate({ yar: { id: '33' } }, sessionMock)
    } catch (e) {
      expect(e.message).toBe('Invalid state')
    }
  })
})
