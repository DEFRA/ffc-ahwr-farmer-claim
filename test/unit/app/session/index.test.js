const session = require('../../../../app/session')

describe('session', () => {
  const endemicsClaimKey = 'endemicsClaim'
  const claimKey = 'claim'
  const tokensSectionKey = 'tokens'
  const customerSectionKey = 'customer'
  const pkcecodesSectionKey = 'pkcecodes'
  const tempClaimReferenceKey = 'tempClaimReference'

  const value = 'value'
  const objectValue = { key: value }

  const getFunctionsToTest = [
    { func: 'getClaim', expectedSectionKey: claimKey },
    { func: 'getEndemicsClaim', expectedSectionKey: endemicsClaimKey },
    { func: 'getToken', expectedSectionKey: tokensSectionKey },
    { func: 'getCustomer', expectedSectionKey: customerSectionKey },
    { func: 'getPkcecodes', expectedSectionKey: pkcecodesSectionKey }
  ]

  const setFunctionsToTest = [
    { func: 'setEndemicsClaim', expectedSectionKey: endemicsClaimKey },
    { func: 'setClaim', expectedSectionKey: claimKey },
    { func: 'setToken', expectedSectionKey: tokensSectionKey },
    { func: 'setCustomer', expectedSectionKey: customerSectionKey },
    { func: 'setPkcecodes', expectedSectionKey: pkcecodesSectionKey },
    { func: 'setTempClaimReference', expectedSectionKey: tempClaimReferenceKey }
  ]

  const keysAndValuesToTest = [
    { key: 'key', value },
    { key: 'unknown', value: undefined },
    { key: false, value: objectValue },
    { key: null, value: objectValue },
    { key: undefined, value: objectValue }
  ]

  describe.each(getFunctionsToTest)('"$func" retrieves value from "$expectedSectionKey" based on key value', ({ func, expectedSectionKey }) => {
    test.each(keysAndValuesToTest)('key value - $key', async ({ key, value }) => {
      let sectionKey
      const requestGetMock = { yar: { get: (entryKey) => { sectionKey = entryKey; return objectValue } } }

      const application = session[func](requestGetMock, key)

      expect(application).toEqual(value)
      expect(sectionKey).toEqual(expectedSectionKey)
    })
  })

  describe.each(setFunctionsToTest)('"$func" sets value in "$expectedSectionKey" based on key value when no value exists in "$expectedSectionKey"', ({ func, expectedSectionKey }) => {
    test.each(keysAndValuesToTest)('key value - $key', async ({ key, value }) => {
      const yarMock = {
        get: jest.fn(),
        set: jest.fn()
      }
      const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

      session[func](requestSetMock, key, value)

      expect(requestSetMock.yar.get).toHaveBeenCalledTimes(2)
      expect(requestSetMock.yar.get).toHaveBeenCalledWith(expectedSectionKey)
      expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
      expect(requestSetMock.yar.set).toHaveBeenCalledWith(expectedSectionKey, { [key]: value })
    })
  })

  describe.each(setFunctionsToTest)('"$func" sets value in "$expectedSectionKey" based on key when a value already exists in "$expectedSectionKey"', ({ func, expectedSectionKey }) => {
    test.each(keysAndValuesToTest)('key value - $key', async ({ key, value }) => {
      const existingValue = { existingKey: 'existing-value' }
      const yarMock = {
        get: jest.fn(() => existingValue),
        set: jest.fn()
      }
      const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

      session[func](requestSetMock, key, value)

      expect(requestSetMock.yar.get).toHaveBeenCalledTimes(2)
      expect(requestSetMock.yar.get).toHaveBeenCalledWith(expectedSectionKey)
      expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
      expect(requestSetMock.yar.set).toHaveBeenCalledWith(expectedSectionKey, { ...{ [key]: value }, ...existingValue })
    })
  })

  const valueToBeTrimmed = '    to be trimmed   '
  test.each(setFunctionsToTest)(`"$func" sets value once trimmed, when the value is a string (value = "${valueToBeTrimmed}")`, async ({ func, expectedSectionKey }) => {
    const key = 'key'
    const yarMock = {
      get: jest.fn(),
      set: jest.fn()
    }
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session[func](requestSetMock, key, valueToBeTrimmed)

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(2)
    expect(requestSetMock.yar.get).toHaveBeenCalledWith(expectedSectionKey)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
    expect(requestSetMock.yar.set).toHaveBeenCalledWith(expectedSectionKey, { [key]: valueToBeTrimmed.trim() })
  })

  test.each(setFunctionsToTest)(`"$func" does not trim value when the value is not a string (value = "${objectValue}")`, async ({ func, expectedSectionKey }) => {
    const key = 'key'
    const yarMock = {
      get: jest.fn(),
      set: jest.fn()
    }
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session[func](requestSetMock, key, objectValue)

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(2)
    expect(requestSetMock.yar.get).toHaveBeenCalledWith(expectedSectionKey)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
    expect(requestSetMock.yar.set).toHaveBeenCalledWith(expectedSectionKey, { [key]: objectValue })
  })

  test('session clear clears correct keys', async () => {
    const yarMock = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }
    session.clear(requestSetMock)

    expect(requestSetMock.yar.clear).toHaveBeenCalledTimes(5)
    expect(requestSetMock.yar.clear).toHaveBeenCalledWith('claim')
    expect(requestSetMock.yar.clear).toHaveBeenCalledWith('endemicsClaim')
    expect(requestSetMock.yar.clear).toHaveBeenCalledWith('application')
    expect(requestSetMock.yar.clear).toHaveBeenCalledWith('organisation')
    expect(requestSetMock.yar.clear).toHaveBeenCalledWith('tempClaimReference')
  })

  test('session clearEndemicsClaim clears correct keys and keeps correct keys', async () => {
    const yarMock = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
    yarMock.get.mockReturnValue({ organisation: 'org', reference: 'ref' })
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }
    session.clearEndemicsClaim(requestSetMock)

    expect(requestSetMock.yar.clear).toHaveBeenCalledTimes(1)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
  })
})
