const { speciesRadios } = require('../../../../app/routes/models/form-component/species-radio')

describe('getYesNoRadios', () => {
  const legendText = 'legendText'
  const id = 'an-id'

  test.each([
    { previousAnswer: 'sheep' },
    { previousAnswer: 'beef' }
  ])('defaults with previousAnswer as $previousAnswer', ({ previousAnswer }) => {
    const res = speciesRadios(legendText, id, previousAnswer)

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
          html: ''
        },
        items: [{
          value: 'beef',
          text: 'Beef cattle',
          checked: previousAnswer === 'beef'
        },
        {
          value: 'dairy',
          text: 'Dairy cattle',
          checked: previousAnswer === 'dairy'
        },
        {
          value: 'sheep',
          text: 'Sheep',
          checked: previousAnswer === 'sheep'
        },
        {
          value: 'pigs',
          text: 'Pigs',
          checked: previousAnswer === 'pigs'
        }]
      }
    })
    expect(res.radios).not.toHaveProperty('errorMessage')
  })

  test('includes error message when test is supplied', () => {
    const errorText = 'error message here'

    const res = speciesRadios(legendText, id, 'sheep', errorText)

    expect(res.radios.errorMessage).toEqual({ text: errorText })
  })

  test('options are used when supplied', () => {
    const isPageHeading = false
    const legendClasses = 'not-a-real-class'
    const inline = true
    const hintHtml = '<p>hint: vet visit</p>'

    const res = speciesRadios(legendText, id, 'pigs', undefined, { isPageHeading, legendClasses, inline, hintHtml })

    expect(res.radios.classes).toEqual('govuk-radios--inline')
    expect(res.radios.fieldset.legend.classes).toEqual(legendClasses)
    expect(res.radios.fieldset.legend.isPageHeading).toEqual(isPageHeading)
    expect(res.radios.hint.html).toEqual(hintHtml)
  })
})
