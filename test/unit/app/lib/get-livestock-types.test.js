import { getLivestockTypes } from '../../../../app/lib/get-livestock-types.js'

describe('getLivestockTypes', () => {
  let typeOfLivestock
  test('returns correct value for beef', () => {
    typeOfLivestock = 'beef'
    const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)

    expect(isBeef).toBe(true)
    expect(isDairy).toBe(false)
    expect(isPigs).toBe(false)
    expect(isSheep).toBe(false)
  })

  test('returns correct value for dairy', () => {
    typeOfLivestock = 'dairy'
    const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)

    expect(isBeef).toBe(false)
    expect(isDairy).toBe(true)
    expect(isPigs).toBe(false)
    expect(isSheep).toBe(false)
  })

  test('returns correct value for pigs', () => {
    typeOfLivestock = 'pigs'
    const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)

    expect(isBeef).toBe(false)
    expect(isDairy).toBe(false)
    expect(isPigs).toBe(true)
    expect(isSheep).toBe(false)
  })

  test('returns correct value for sheep', () => {
    typeOfLivestock = 'sheep'
    const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)

    expect(isBeef).toBe(false)
    expect(isDairy).toBe(false)
    expect(isPigs).toBe(false)
    expect(isSheep).toBe(true)
  })
})
