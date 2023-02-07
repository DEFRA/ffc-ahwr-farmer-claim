describe('business-email.schema', () => {
  const BUSINESS_EMAIL_SCHEMA = require('../../../../app/schemas/business-email.schema')

  test.each([
    {
      toString: () => 'valid email',
      given: {
        businessEmail: 'business@email.com'
      },
      expect: {
        result: {
          value: 'business@email.com'
        }
      }
    },
    {
      toString: () => 'valid uppercase email',
      given: {
        businessEmail: 'Business@email.com'
      },
      expect: {
        result: {
          value: 'business@email.com'
        }
      }
    },
    {
      toString: () => 'valid untrimmed email',
      given: {
        businessEmail: ' Business@email.com  '
      },
      expect: {
        result: {
          value: 'business@email.com'
        }
      }
    },
    {
      toString: () => 'invalid email',
      given: {
        businessEmail: 'business'
      },
      expect: {
        result: {
          value: 'business',
          error: {
            message: '"value" must be a valid email'
          }
        }
      }
    },
    {
      toString: () => 'not a string',
      given: {
        businessEmail: 1
      },
      expect: {
        result: {
          value: 1,
          error: {
            message: '"value" must be a string'
          }
        }
      }
    },
    {
      toString: () => 'empty email',
      given: {
        businessEmail: ''
      },
      expect: {
        result: {
          value: '',
          error: {
            message: '"value" is not allowed to be empty'
          }
        }
      }
    }
  ])('%s', async (testCase) => {
    const result = BUSINESS_EMAIL_SCHEMA.validate(testCase.given.businessEmail)
    expect(result.value).toEqual(testCase.expect.result.value)
    if (typeof result.error === 'undefined') {
      expect(result.error).toBeUndefined()
    } else {
      expect(result.error.message).toEqual(testCase.expect.result.error.message)
    }
  })
})
