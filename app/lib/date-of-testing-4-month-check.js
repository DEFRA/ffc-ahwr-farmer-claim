const AFTER_HOURS = 23; const AFTER_MINS = 59; const AFTER_SECONDS = 59; const AFTER_MILLIS = 999

export const isWithin4MonthsBeforeOrAfterDateOfVisit = (dateOfVisit, dateOfTesting) => {
  const visitDate = new Date(dateOfVisit)
  const testingDate = new Date(dateOfTesting)

  if (isNaN(visitDate) || isNaN(testingDate)) { return false }

  const fourMonthsBefore = new Date(visitDate)
  fourMonthsBefore.setMonth(visitDate.getMonth() - 4)
  fourMonthsBefore.setHours(0, 0, 0, 0)

  const fourMonthsAfter = new Date(visitDate)
  fourMonthsAfter.setMonth(visitDate.getMonth() + 4)
  fourMonthsAfter.setHours(AFTER_HOURS, AFTER_MINS, AFTER_SECONDS, AFTER_MILLIS)

  return testingDate >= fourMonthsBefore && testingDate <= fourMonthsAfter
}
