const notifyClient = require('./notify-client')

/**
 * Send an email via GOV.UK Notify.
 * Matches the `sendEmail` signature from
 * [Notify](https://docs.notifications.service.gov.uk/node.html#send-an-email-arguments)
 *
 * @param {string} templateId UUID of the email template.
 * @param {string} email address to send email to.
 * @param {object} options for personalisation, etc.
 * @return {boolean} value indicating whether the email send was successful or
 * not.
 */
module.exports = async (templateId, email, options) => {
  try {
    console.log(`Attempting to send email with template ID ${templateId} to email ${email}`)
    await notifyClient.sendEmail(templateId, email, options)
    console.log(`Successfully sent email with template ID ${templateId} to email ${email}.`)
    return true
  } catch (e) {
    const error = e?.response?.data ? e.response.data : e.message
    console.error(`Error ${JSON.stringify(error)} occurred during sending of email to address ${email} with template ID ${templateId}.`)
    return false
  }
}
