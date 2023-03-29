const pkce = require('../../../../app/auth/auth-code-grant/proof-key-for-code-exchange')

describe('generateCodeChallenge', () => {
  test('when createCryptoProvider verifier value set in session', async () => {
    const setPkcecodesMock = jest.fn()
    const session = {
      setPkcecodes: setPkcecodesMock
    }
    const result = pkce.generateCodeChallenge(session, undefined)
    expect(result).not.toBeNull()
    expect(setPkcecodesMock).toBeCalledWith(undefined, 'verifier', expect.anything())
  })
})
