const getTestResult = (testResult) => {
  return {
    isPositive: testResult === 'positive',
    isNegative: testResult === 'negative'
  }
}

module.exports = { getTestResult }
