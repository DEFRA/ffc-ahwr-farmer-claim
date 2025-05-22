import * as session from '../../../../app/session'

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

  test('session clearEndemicsClaim clears correct keys and keeps correct keys when no MH data', async () => {
    const yarMock = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
    yarMock.get.mockReturnValue({ organisation: 'org', reference: 'ref' })
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session.clearEndemicsClaim(requestSetMock)

    const EXPECTED_NUM_CALLS_TO_SET = 3 // each time 'set' is called, it calls 'get' twice.
    const EXPECTED_NUM_CALLS_TO_GET = (EXPECTED_NUM_CALLS_TO_SET * 2) + 1 // clearEndemicsClaim only calls getEndemicsClaim once

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(EXPECTED_NUM_CALLS_TO_GET)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(EXPECTED_NUM_CALLS_TO_SET)

    // check all data set/cleared when making last call to set
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].organisation).toBe('org')
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].latestVetVisitApplication).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].latestEndemicsApplication).toBeUndefined()
  })

  test('session clearEndemicsClaim clears correct keys and keeps correct keys when there is MH data', async () => {
    const yarMock = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
    yarMock.get.mockReturnValue({
      organisation: 'org',
      reference: 'ref',
      tempHerdId: 'dummy-to-verify-cleared',
      herdId: 'dummy-to-verify-cleared',
      herdName: 'dummy-to-verify-cleared',
      herdCph: 'dummy-to-verify-cleared',
      herdOthersOnSbi: 'dummy-to-verify-cleared',
      herdReasons: 'dummy-to-verify-cleared',
      herdSame: 'dummy-to-verify-cleared'
    })
    const requestSetMock = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session.clearEndemicsClaim(requestSetMock)

    const EXPECTED_NUM_CALLS_TO_SET = 10 // each time 'set' is called, it calls 'get' twice.
    const EXPECTED_NUM_CALLS_TO_GET = (EXPECTED_NUM_CALLS_TO_SET * 2) + 1 // clearEndemicsClaim only calls 'getEndemicsClaim' once

    expect(requestSetMock.yar.get).toHaveBeenCalledTimes(EXPECTED_NUM_CALLS_TO_GET)
    expect(requestSetMock.yar.set).toHaveBeenCalledTimes(EXPECTED_NUM_CALLS_TO_SET)

    // check all data set/cleared when making last call to set
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].organisation).toBe('org')
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].latestVetVisitApplication).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].latestEndemicsApplication).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].tempHerdId).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdId).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdName).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdCph).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdOthersOnSbi).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdReasons).toBeUndefined()
    expect(requestSetMock.yar.set.mock.calls[EXPECTED_NUM_CALLS_TO_SET - 1][1].herdSame).toBeUndefined()
  })
})
