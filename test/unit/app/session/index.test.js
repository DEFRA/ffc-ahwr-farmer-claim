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
    const sessionDataBeforeCall = {
      organisation: 'dummy-organisation',
      latestVetVisitApplication: { dummy: 'dummy-latestVetVisitApplication' },
      latestEndemicsApplication: { dummy: 'dummy-latestEndemicsApplication' },
      reference: 'dummy-reference-should-be-removed'
    }
    const yarMock = { get: jest.fn(), set: jest.fn(), clear: jest.fn() }
    yarMock.get
      .mockReturnValueOnce(sessionDataBeforeCall) // call before session cleared
      .mockReturnValue({}) // all calls after session cleared
    const request = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session.clearEndemicsClaim(request)

    expect(request.yar.clear).toHaveBeenCalledTimes(1)
    expect(request.yar.set).toHaveBeenCalledTimes(3)
    // verify last call includes only correct keys/values
    expect(yarMock.set.mock.lastCall).toEqual(['endemicsClaim', {
      organisation: sessionDataBeforeCall.organisation,
      latestVetVisitApplication: sessionDataBeforeCall.latestVetVisitApplication,
      latestEndemicsApplication: sessionDataBeforeCall.latestEndemicsApplication
    }])
  })

  test('session removeSessionDataForSelectHerdChange clears and keeps correct keys', async () => {
    const sessionDataBeforeCall = {
      organisation: 'dummy-organisation',
      latestVetVisitApplication: { dummy: 'dummy-latestVetVisitApplication' },
      latestEndemicsApplication: { dummy: 'dummy-latestEndemicsApplication' },
      previousClaims: [{ dummy: 'dummy-previousClaims' }],
      reference: 'dummy-reference',
      typeOfLivestock: 'dummy-typeOfLivestock',
      typeOfReview: 'dummy-typeOfReview',
      dateOfVisit: 'dummy-dateOfVisit',
      tempHerdId: 'dummy-tempHerdId',
      herds: [{ dummy: 'dummy-herds' }],
      dummy: 'dummy-should-be-removed'
    }
    const yarMock = { get: jest.fn(), set: jest.fn(), clear: jest.fn() }
    yarMock.get
      .mockReturnValueOnce(sessionDataBeforeCall) // call before session cleared
      .mockReturnValue({}) // all calls after session cleared
    const request = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session.removeSessionDataForSelectHerdChange(request)

    expect(request.yar.clear).toHaveBeenCalledTimes(1)
    expect(request.yar.set).toHaveBeenCalledTimes(11)
    // verify last call includes only correct keys/values
    expect(yarMock.set.mock.lastCall).toEqual(['endemicsClaim', {
      organisation: sessionDataBeforeCall.organisation,
      latestVetVisitApplication: sessionDataBeforeCall.latestVetVisitApplication,
      latestEndemicsApplication: sessionDataBeforeCall.latestEndemicsApplication,
      previousClaims: sessionDataBeforeCall.previousClaims,
      reference: sessionDataBeforeCall.reference,
      typeOfLivestock: sessionDataBeforeCall.typeOfLivestock,
      typeOfReview: sessionDataBeforeCall.typeOfReview,
      dateOfVisit: sessionDataBeforeCall.dateOfVisit,
      tempHerdId: sessionDataBeforeCall.tempHerdId,
      herds: sessionDataBeforeCall.herds
    }])
  })

  test('session removeSessionDataForSameHerdChange clears and keeps correct keys', async () => {
    const sessionDataBeforeCall = {
      organisation: 'dummy-organisation',
      latestVetVisitApplication: { dummy: 'dummy-latestVetVisitApplication' },
      latestEndemicsApplication: { dummy: 'dummy-latestEndemicsApplication' },
      previousClaims: [{ dummy: 'dummy-previousClaims' }],
      reference: 'dummy-reference',
      typeOfLivestock: 'dummy-typeOfLivestock',
      typeOfReview: 'dummy-typeOfReview',
      dateOfVisit: 'dummy-dateOfVisit',
      tempHerdId: 'dummy-tempHerdId',
      herds: [{ dummy: 'dummy-herds' }],
      herdId: 'dummy-herdId',
      herdVersion: 'dummy-herdVersion',
      herdName: 'dummy-herdName',
      herdCph: 'dummy-herdCph',
      herdOthersOnSbi: 'dummy-herdOthersOnSbi',
      herdReasons: 'dummy-herdReasons',
      dummy: 'dummy-should-be-removed'
    }
    const yarMock = { get: jest.fn(), set: jest.fn(), clear: jest.fn() }
    yarMock.get
      .mockReturnValueOnce(sessionDataBeforeCall) // call before session cleared
      .mockReturnValue({}) // all calls after session cleared
    const request = { yar: yarMock, headers: { 'x-forwarded-for': '1.1.1.1' } }

    session.removeSessionDataForSameHerdChange(request)

    expect(request.yar.clear).toHaveBeenCalledTimes(1)
    expect(request.yar.set).toHaveBeenCalledTimes(18)
    // verify last call includes only correct keys/values
    expect(yarMock.set.mock.lastCall).toEqual(['endemicsClaim', {
      organisation: sessionDataBeforeCall.organisation,
      latestVetVisitApplication: sessionDataBeforeCall.latestVetVisitApplication,
      latestEndemicsApplication: sessionDataBeforeCall.latestEndemicsApplication,
      previousClaims: sessionDataBeforeCall.previousClaims,
      reference: sessionDataBeforeCall.reference,
      typeOfLivestock: sessionDataBeforeCall.typeOfLivestock,
      typeOfReview: sessionDataBeforeCall.typeOfReview,
      dateOfVisit: sessionDataBeforeCall.dateOfVisit,
      tempHerdId: sessionDataBeforeCall.tempHerdId,
      herds: sessionDataBeforeCall.herds,
      herdId: sessionDataBeforeCall.herdId,
      herdVersion: sessionDataBeforeCall.herdVersion,
      herdName: sessionDataBeforeCall.herdName,
      herdCph: sessionDataBeforeCall.herdCph,
      herdOthersOnSbi: sessionDataBeforeCall.herdOthersOnSbi,
      herdReasons: sessionDataBeforeCall.herdReasons
    }])
  })
})
