
export const notOtherDiseaseTypeNoResult = (testResult, pageContent, h, errorList, backLink, viewPage) => {
  if (testResult) return

  return h.view(viewPage, { ...pageContent, backLink, errorList }).code(400).takeover()
}

export const getErrorResultString = (payload, validatorFn) => {
  let diseaseTypeValidationError
  let testResultValidationError

  if (typeof payload.diseaseType === 'string' || typeof payload.testResult === 'string') {
    diseaseTypeValidationError = validatorFn('diseaseType').validate(`${payload.diseaseType}`).error?.details[0]?.message
    testResultValidationError = validatorFn('testResult').validate(`${payload.testResult}`).error?.details[0]?.message
  }
  return {
    diseaseType: { value: payload.diseaseType, text: diseaseTypeValidationError },
    testResult: { value: payload.testResult, text: testResultValidationError }
  }
}

export const getErrorResultObject = (payload, newDiseaseValidationFn) => {
  const payloadDataError = {}
  if (typeof payload.diseaseType === 'object' && payload.diseaseType.length > 1) {
    const { newPayloadData, newDiseaseTypeErrorMessage: newErrorMessage } = newDiseaseValidationFn(payload)

    payloadDataError.newPayloadData = newPayloadData
    payloadDataError.newErrorMessage = newErrorMessage
  }

  return payloadDataError
}
