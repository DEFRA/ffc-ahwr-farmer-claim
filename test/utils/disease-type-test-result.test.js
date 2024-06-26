const { OtherDiseaseTypeNoResult } = require('../../app/routes/utils/disease-type-test-result')

describe('OtherDiseaseTypeNoResult', () => {
  test('should return an HTTP 400 response if testResult is falsy', () => {
    const testResult = false
    const pageContent = {}
    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
    const errorList = []
    const backLink = 'some-back-link'
    const viewPage = 'some-view-page'

    const response = OtherDiseaseTypeNoResult(testResult, pageContent, h, errorList, backLink, viewPage)

    expect(h.view).toHaveBeenCalledWith(viewPage, {
      ...pageContent,
      backLink,
      errorList
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(h.takeover).toHaveBeenCalled()
    expect(response).toBe(h)
  })
  test('should not return an HTTP 400 response if testResult is truthy', () => {
    const testResult = true
    const pageContent = {}
    const h = {
      view: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis()
    }
    const errorList = []
    const backLink = 'some-back-link'
    const viewPage = 'some-view-page'

    const response = OtherDiseaseTypeNoResult(testResult, pageContent, h, errorList, backLink, viewPage)

    expect(h.view).not.toHaveBeenCalled()
    expect(h.code).not.toHaveBeenCalled()
    expect(h.takeover).not.toHaveBeenCalled()
    expect(response).toBeUndefined()
  })
})
