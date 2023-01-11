function hasCorrectContent ($, pageType) {
  const hintText = "We'll use this to send you a link to claim funding for a review. This must be the business email address linked to the business claiming for a review."
  expect($('h1').text()).toMatch('Enter your email address')
  expect($('label[for=email]').text()).toMatch('Email address')
  expect($('#email-hint').text()).toMatch(hintText)
}

module.exports = {
  hasCorrectContent
}
