import { getHerdOrFlock, upperFirstLetter } from '../../../../app/lib/display-helpers'

describe('getHerdOrFlock', () => {
  it('returns flock when typeOfLivestock is sheep', () => {
    expect(getHerdOrFlock('sheep')).toBe('flock')
  })

  it('returns herd when typeOfLivestock is not sheep', () => {
    expect(getHerdOrFlock('beef')).toBe('herd')
  })
})

describe('upperFirstLetter', () => {
  it('returns undefined for empty string', () => {
    expect(upperFirstLetter('')).toBeUndefined()
  })

  it('returns undefined for null', () => {
    expect(upperFirstLetter(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(upperFirstLetter(undefined)).toBeUndefined()
  })

  it('returns the string with the first letter capitalized', () => {
    expect(upperFirstLetter('hello')).toBe('Hello')
  })

  it('returns the same string if the first letter is already capitalized', () => {
    expect(upperFirstLetter('Hello')).toBe('Hello')
  })
})
