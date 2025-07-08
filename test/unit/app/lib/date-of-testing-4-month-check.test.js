import { isWithin4MonthsBeforeOrAfterDateOfVisit } from '../../../../app/lib/date-of-testing-4-month-check'

describe('Check if the date is with in 4 months', () => {
  test('it returns true for 2 dates which are 2 months apart', () => {
    expect(isWithin4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-06-23'))).toBe(true)
  })

  test('it returns true for 2 dates which are exactly 4 months apart', () => {
    expect(isWithin4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-08-23'))).toBe(true)
  })

  test('it returns false for 2 dates which are over 4 months apart', () => {
    expect(isWithin4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2024-08-24'))).toBe(false)
  })

  test('it returns true for 2 dates which are within 4 months but it goes into the next year', () => {
    expect(isWithin4MonthsBeforeOrAfterDateOfVisit(new Date('2023-12-23'), new Date('2024-04-23'))).toBe(true)
  })

  test('it returns false for 2 dates which are over 4 months and goes into the next year', () => {
    expect(isWithin4MonthsBeforeOrAfterDateOfVisit(new Date('2024-04-23'), new Date('2023-12-22'))).toBe(false)
  })
})
