const { getYesNoRadios } = require('../../../../app/routes/models/form-component/yes-no-radios')

describe('getYesNoRadios', () => {
  const legendText = 'legendText'
  const id = 'an-id'

  test.each([
    { previousAnswer: 'yes' },
    { previousAnswer: 'no' }
  ])('defaults with previousAnswer as $previousAnswer', ({ previousAnswer }) => {
    const res = getYesNoRadios(legendText, id, previousAnswer)

    expect(res).toEqual({
      radios: {
        idPrefix: id,
        name: id,
        fieldset: {
          legend: {
            text: legendText,
            isPageHeading: true,
            classes: 'govuk-fieldset__legend--l'
          }
        },
        hint: {
          text: ''
        },
        items: [{
          value: 'yes',
          text: 'Yes',
          checked: previousAnswer === 'yes'
        }, {
          value: 'no',
          text: 'No',
          checked: previousAnswer === 'no'
        }]
      }
    })
    expect(res.radios).not.toHaveProperty('errorMessage')
  })

  test('includes error message when test is supplied', () => {
    const errorText = 'error message here'

    const res = getYesNoRadios(legendText, id, 'yes', errorText)

    expect(res.radios.errorMessage).toEqual({ text: errorText })
  })

  test('options are used when supplied', () => {
    const isPageHeading = false
    const legendClasses = 'not-a-real-class'
    const inline = true
    const hintText = 'hint: vet visit'

    const res = getYesNoRadios(legendText, id, 'yes', undefined, { isPageHeading, legendClasses, inline, hintText })

    expect(res.radios.classes).toEqual('govuk-radios--inline')
    expect(res.radios.fieldset.legend.classes).toEqual(legendClasses)
    expect(res.radios.fieldset.legend.isPageHeading).toEqual(isPageHeading)
    expect(res.radios.hint.text).toEqual(hintText)
  })
})
