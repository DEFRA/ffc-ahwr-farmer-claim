const isValidDate = (year, month, day) => {
  const dateObject = new Date(year, month - 1, day)
  return (
    dateObject.getFullYear() === year &&
      dateObject.getMonth() === month - 1 &&
      dateObject.getDate() === day
  )
}

const isWithin10Months = (a, b) => {
  const [dateA, dateB] = [new Date(a), new Date(b)]
  const [firstDate, secondDate] = dateA < dateB ? [dateA, dateB] : [dateB, dateA]
  const firstDatePlus10Months = firstDate.setMonth(firstDate.getMonth() + 10)
  return firstDatePlus10Months >= secondDate
}

module.exports = {
  isValidDate,
  isWithin10Months
}
