import { getErrorResultString } from '../../app/routes/utils/disease-type-test-result.js'

describe('getErrorResultString', () => {
  it('should return the validation message object', () => {
    const payload = {
      diseaseType: 'someDiseaseType',
      testResult: 'positive'
    }
    const validatorFn = (field) => {
      return {
        validate: (value) => {
          if (field === 'diseaseType') {
            return {
              error: null
            }
          } else if (field === 'testResult') {
            return {
              error: null
            }
          }
        }
      }
    }
    const result = getErrorResultString(payload, validatorFn)
    expect(result).toEqual(expect.objectContaining({
      diseaseType: { value: 'someDiseaseType', text: undefined },
      testResult: { value: 'positive', text: undefined }
    }))
  })

  it('should return the validation message object with error messages', () => {
    const payload = {
      diseaseType: 'someInvalidDiseaseType',
      testResult: 'negative'
    }
    const validatorFn = (field) => {
      return {
        validate: (value) => {
          if (field === 'diseaseType') {
            return {
              error: {
                details: [
                  { message: 'Invalid disease type' }
                ]
              }
            }
          } else if (field === 'testResult') {
            return {
              error: {
                details: [
                  { message: 'Invalid test result' }
                ]
              }
            }
          }
        }
      }
    }
    const result = getErrorResultString(payload, validatorFn)
    expect(result).toEqual(expect.objectContaining({
      diseaseType: { value: 'someInvalidDiseaseType', text: 'Invalid disease type' },
      testResult: { value: 'negative', text: 'Invalid test result' }
    }))
  })
})
