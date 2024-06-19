const isValidDate = (year, month, day) => {
  const dateObject = new Date(year, month - 1, day)
  return (
    dateObject.getFullYear() === year &&
      dateObject.getMonth() === month - 1 &&
      dateObject.getDate() === day
  )
}

module.exports = {
  isValidDate
}
