const getDateInputErrors = require('../../../../../app/lib/visit-date/date-input-errors')
const { inputErrorClass, labels } = require('../../../../../app/config/visit-date')

describe('date input error message', () => {
  const emptyErrorDetails = [
    { context: { label: labels.day, value: '', key: labels.day } },
    { context: { label: labels.month, value: '', key: labels.month } },
    { context: { label: labels.year, value: '', key: labels.year } }
  ]

  const emptyPayload = {}
  emptyPayload[labels.day] = ''
  emptyPayload[labels.month] = ''
  emptyPayload[labels.year] = ''

  const fullPayload = {}
  fullPayload[labels.day] = 31
  fullPayload[labels.month] = 12
  fullPayload[labels.year] = 2022

  test('returns message to enter value when no values have been entered', () => {
    const errorDetails = [...emptyErrorDetails]
    const payload = { ...emptyPayload }

    const res = getDateInputErrors(errorDetails, payload)

    expect(res.errorMessage.text).toEqual('Enter the date of the visit')
  })

  test.each([
    { label: labels.day, value: 31, error: 'Date must include a month and a year' },
    { label: labels.month, value: 12, error: 'Date must include a day and a year' },
    { label: labels.year, value: 2022, error: 'Date must include a day and a month' }
  ])('returns message to enter value when single value has been entered - %p', ({ label, value, error }) => {
    const errorDetails = emptyErrorDetails.filter(err => err.context.label !== label)
    const payload = { ...emptyPayload }
    payload[label] = value

    const res = getDateInputErrors(errorDetails, payload)

    expect(res.errorMessage.text).toEqual(error)
  })

  test.each([
    { label: labels.day, error: 'Date must include a day' },
    { label: labels.month, error: 'Date must include a month' },
    { label: labels.year, error: 'Date must include a year' }
  ])('returns message to enter value when two values have been entered - %p', ({ label, error }) => {
    const errorDetails = [{ context: { label, value: '', key: label } }]
    const payload = { ...fullPayload }
    payload[label] = ''

    const res = getDateInputErrors(errorDetails, payload)

    expect(res.errorMessage.text).toEqual(error)
  })

  test.each([
    { label: labels.day, value: 32, type: 'number.max' },
    { label: labels.day, value: 0, type: 'number.min' },
    { label: labels.month, value: 13, type: 'number.max' },
    { label: labels.month, value: 0, type: 'number.min' },
    { label: labels.year, value: 2023, type: 'number.max' },
    { label: labels.year, value: 2021, type: 'number.min' }
  ])('returns real date message and highlighted item when single item is incorrect - %p', ({ label, value, type }) => {
    const payload = { ...fullPayload }
    delete payload[label]
    const errorDetails = [
      { context: { label, value }, type }
    ]

    const { errorMessage, items } = getDateInputErrors(errorDetails, payload)
    expect(errorMessage.text).toEqual('Date must be a real date')
    const errorItems = items.filter(x => x.classes.includes(inputErrorClass))
    expect(errorItems).toHaveLength(1)
    expect(errorItems[0].name).toEqual(label.split('-').pop())
  })

  const maxErrorDetails = [
    { context: { label: labels.day, value: 32, key: labels.day } },
    { context: { label: labels.month, value: 13, key: labels.month } },
    { context: { label: labels.year, value: 2023, key: labels.year } }
  ]

  test.each([
    { label: labels.day },
    { label: labels.month },
    { label: labels.year }
  ])('returns real date message and highlights all items when two items are incorrect - %p', ({ label }) => {
    const payload = { ...fullPayload }
    const errorDetails = maxErrorDetails.filter(err => err.context.label !== label)

    const { errorMessage, items } = getDateInputErrors(errorDetails, payload)

    expect(errorMessage.text).toEqual('The date the review was completed must be in the past')
    const errorItems = items.filter(x => x.classes.includes(inputErrorClass))
    expect(errorItems).toHaveLength(3)
  })

  const firstValidDate = new Date(2022, 6, 13)
  test.each([
    { label: labels.day, value: 999, expectedErrorMessage: 'The date the review was completed must be in the past' },
    { label: labels.month, value: 999, expectedErrorMessage: 'The date the review was completed must be in the past' },
    { label: labels.year, value: 999, expectedErrorMessage: `Date must be the same or after ${firstValidDate.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when the application was made` }
  ])('returns all items highlighted with values set - %p', ({ label, value, expectedErrorMessage }) => {
    const errorDetails = [{
      context: { label, value, key: label }
    }]
    const payload = { ...fullPayload }
    payload[label] = value

    const { errorMessage, items } = getDateInputErrors(errorDetails, payload, firstValidDate)

    expect(errorMessage.text).toEqual(expectedErrorMessage)
    expect(items).toHaveLength(3)
    items.forEach((item, i) => {
      switch (i) {
        case 0:
          expect(item.name).toEqual('day')
          break
        case 1:
          expect(item.name).toEqual('month')
          break
        case 2:
          expect(item.name).toEqual('year')
          break
      }

      expect(item.classes).toContain(inputErrorClass)
      if (item.name === 'year') {
        expect(item.classes).toContain('govuk-input--width-4')
      } else {
        expect(item.classes).toContain('govuk-input--width-2')
      }
    })
  })
})
