export const isWithin4MonthsBeforeOrAfterDateOfVisit = (dateOfVisit, dateOfTesting) => {
  const visitDate = new Date(dateOfVisit)
  const testingDate = new Date(dateOfTesting)

  if (isNaN(visitDate) || isNaN(testingDate)) return false

  const fourMonthsBefore = new Date(visitDate)
  fourMonthsBefore.setMonth(visitDate.getMonth() - 4)
  fourMonthsBefore.setHours(0, 0, 0, 0)

  const fourMonthsAfter = new Date(visitDate)
  fourMonthsAfter.setMonth(visitDate.getMonth() + 4)
  fourMonthsAfter.setHours(23, 59, 59, 999)

  return testingDate >= fourMonthsBefore && testingDate <= fourMonthsAfter
}
