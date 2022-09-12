const { yes, no, na } = require('../../constants/vaccination-up-to-date-options')

/**
 * Generate GOV.UK radios component.
 *
 * @param {string} legendText heading text for radios.
 * @param {string} id of the radio component.
 * @param {string} previousAnswer one of the vaccinated options.
 * @param {string} [errorText] error message to display.
 * @param {object} [options] an object containing `isPageHeading` (boolean, determines if the legendText is marked as a heading), `legendClasses` (string, contains classes to add to legendText), `inline` (boolean determines if the class to make the radios display as inline is added) and hintHtml (html string to display hint message with the radio button).
 *
 * @return {object} object with `radios` property containing radios component.
 */
function speciesVaccinationUpToDateRadios (legendText, id, previousAnswer, errorText = undefined, options = {}) {
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
          value: yes.value,
          text: yes.text,
          checked: previousAnswer === yes.value
        },
        {
          value: no.value,
          text: no.text,
          checked: previousAnswer === no.value
        },
        {
          value: na.value,
          text: na.text,
          checked: previousAnswer === na.value
        }
      ],
      ...(errorText ? { errorMessage: { text: errorText } } : {})
    }
  }
}

module.exports = {
  speciesVaccinationUpToDateRadios
}
