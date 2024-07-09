
const notOtherDiseaseTypeNoResult = (testResult, pageContent, h, errorList, backLink, viewPage) => {
  if (testResult) return
  console.log(`results for testResult ${testResult} viewPage: ${viewPage} and pageContent ${pageContent} backLink ${backLink} and errorList is ${errorList}`)
  return h.view(viewPage, { ...pageContent, backLink, errorList }).code(400).takeover()
}



const getErrorResultString = (payload, validatorFn) => {
  let diseaseTypeValidationError
  let testResultValidationError

  if (typeof payload.diseaseType === 'string' || typeof payload.testResult === 'string') {
    diseaseTypeValidationError = validatorFn('diseaseType').validate(`${payload.diseaseType}`).error?.details[0]?.message
    testResultValidationError = validatorFn('testResult').validate(`${payload.testResult}`).error?.details[0]?.message
  }
  const validationMessage = {
    diseaseType: { value: payload.diseaseType, text: diseaseTypeValidationError },
    testResult: { value: payload.testResult, text: testResultValidationError }
  }
  return validationMessage
}

const getErrorResultObject = (payload, newDiseaseValidationFn) => {
  const payloadDataError = {}
  if (typeof payload.diseaseType === 'object' && payload.diseaseType.length > 1) {
    const { newPayloadData, newDiseaseTypeErrorMessage: newErrorMessage } = newDiseaseValidationFn(payload)
    console.log(`newPayloadData ${newPayloadData} and ${newErrorMessage}`)
    payloadDataError.newPayloadData = newPayloadData
    payloadDataError.newErrorMessage = newErrorMessage
  }
  console.log(`payloadDataError befor the results printed ${JSON.stringify(payloadDataError)}`)
  return payloadDataError
}

module.exports = {
  notOtherDiseaseTypeNoResult,
  getErrorResultString,
  getErrorResultObject,
}
