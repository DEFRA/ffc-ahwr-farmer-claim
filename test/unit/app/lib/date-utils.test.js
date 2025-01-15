const { isValidDate, isWithin10Months } = require('../../../../app/lib/date-utils')

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

test('isWithin10Months', () => {
  expect(isWithin10Months('2024-01-01', '2024-11-01')).toBe(true)
  expect(isWithin10Months('2024-11-01', '2024-01-01')).toBe(true)
  expect(isWithin10Months('2024-01-01', '2024-11-02')).toBe(false)
  expect(isWithin10Months('2024-11-02', '2024-01-01')).toBe(false)
})
