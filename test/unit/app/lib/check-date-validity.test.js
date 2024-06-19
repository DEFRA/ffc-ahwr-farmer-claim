const { isValidDate } = require('../../../../app/lib/check-date-validity')

describe('isValidDate', () => {
  test('returns true for a valid date', () => {
    expect(isValidDate(2023, 5, 15)).toBe(true)
  })

  test('returns false for an invalid date', () => {
    expect(isValidDate(2023, 2, 30)).toBe(false)
  })

  test('handles month values starting from 1', () => {
    expect(isValidDate(2023, 0, 1)).toBe(false)
    expect(isValidDate(2023, 13, 1)).toBe(false)
  })

  test('handles leap years correctly', () => {
    expect(isValidDate(2024, 2, 29)).toBe(true)
    expect(isValidDate(2023, 2, 29)).toBe(false)
  })
})
