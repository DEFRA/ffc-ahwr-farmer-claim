function hasCorrectContent ($, pageType) {
  const hintText = "We'll use this to send you a link to claim funding for a review"
  expect($('h1').text()).toMatch('Enter your email address')
  expect($('label[for=email]').text()).toMatch('Enter your email address')
  expect($('#email-hint').text()).toMatch(hintText)
}

module.exports = {
  hasCorrectContent
}
