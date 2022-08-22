const session = require('../../../../app/session')

describe('session', () => {
  const applicationSectionKey = 'application'
  const claimKey = 'claim'

  const value = 'value'
  const objectValue = { key: value }

  const getFunctionsToTest = [
    { func: 'getApplication', expectedSectionKey: applicationSectionKey },
    { func: 'getClaim', expectedSectionKey: claimKey }
  ]

  const setFunctionsToTest = [
    { func: 'setApplication', expectedSectionKey: applicationSectionKey },
    { func: 'setClaim', expectedSectionKey: claimKey }
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
      const requestSetMock = { yar: yarMock }

      session[func](requestSetMock, key, value)

      expect(requestSetMock.yar.get).toHaveBeenCalledTimes(1)
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
      const requestSetMock = { yar: yarMock }

      session[func](requestSetMock, key, value)

      expect(requestSetMock.yar.get).toHaveBeenCalledTimes(1)
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
    const requestSetMock = { yar: yarMock }

    session[func](requestSetMock, key, valueToBeTrimmed)

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(1)
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
    const requestSetMock = { yar: yarMock }

    session[func](requestSetMock, key, objectValue)

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(1)
    expect(requestSetMock.yar.get).toHaveBeenCalledWith(expectedSectionKey)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(1)
    expect(requestSetMock.yar.set).toHaveBeenCalledWith(expectedSectionKey, { [key]: objectValue })
  })
})
