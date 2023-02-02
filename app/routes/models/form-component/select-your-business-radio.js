const radios = require('./radios')

function selectYourBusinessRadioOptions (businesses, legendText, id, previousAnswer, errorText = undefined, options = {}) {
  return radios(legendText, id, errorText, options)(businesses.map(business => ({
    value: business.sbi,
    text: `${business.sbi} - ${business.businessName}`,
    checked: previousAnswer === business.sbi
  })))
}

module.exports = {
  selectYourBusinessRadioOptions
}
