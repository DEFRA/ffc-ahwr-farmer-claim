import { getHerdOrFlock } from '../../../../app/lib/display-helpers'

describe('getHerdOrFlock', () => {
  it('returns flock when typeOfLivestock is sheep', () => {
    expect(getHerdOrFlock('sheep')).toBe('flock')
  })

  it('returns herd when typeOfLivestock is not sheep', () => {
    expect(getHerdOrFlock('beef')).toBe('herd')
  })
})
