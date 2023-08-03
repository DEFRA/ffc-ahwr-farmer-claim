function speciesRadios (legendText, id, previousAnswer, errorText = undefined, options = {}) {
  const { isPageHeading = true, legendClasses = 'govuk-fieldset__legend--l', inline = false, hintHtml = '' } = options
  return {
    radios: {
      classes: inline ? 'govuk-radios--inline' : undefined,
      idPrefix: id,
      name: id,
      fieldset: {
        legend: {
          text: legendText,
          isPageHeading,
          classes: legendClasses
        }
      },
      hint: {
        html: hintHtml
      },
      items: [
        {
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
        }
      ],
      ...(errorText ? { errorMessage: { text: errorText } } : {})
    }
  }
}

module.exports = {
  speciesRadios
}
