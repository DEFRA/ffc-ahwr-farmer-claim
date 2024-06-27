
const OtherDiseaseTypeNoResult = (testResult, pageContent, h, errorList, backLink, viewPage) => {
  if (!testResult) {
    return h.view(viewPage, {
      ...pageContent,
      backLink,
      errorList
    }).code(400).takeover()
  }
}

module.exports = {
  OtherDiseaseTypeNoResult
}
