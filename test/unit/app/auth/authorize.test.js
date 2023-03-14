const { getAuthenticationUrl } = require('../../../../app/auth')

describe('Generate authentication url test', () => {
  test('when getAuthenticationUrl with pkce true challenge parameter added', async () => {
    const setPkcecodesMock = jest.fn()
    const setTokenMock = jest.fn()
    const session = {
      setPkcecodes: setPkcecodesMock,
      setToken: setTokenMock
    }
    const result = getAuthenticationUrl(session, undefined)
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
    const result = getAuthenticationUrl(session, undefined, false)
    const params = new URL(result).searchParams
    expect(params.get('code_challenge')).toBeNull()
  })
})
