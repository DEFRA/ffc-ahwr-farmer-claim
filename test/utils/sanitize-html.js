const sanitizeHTML = (html) => {
  return html
    .replace(/<input type="hidden" name="crumbBanner" id="crumbBanner" value=".*?"/g, '<input type="hidden" name="crumbBanner" id="crumbBanner" value="SANITIZED"')
    .replace(/<input type="hidden" name="crumb" value=".*?"/g, '<input type="hidden" name="crumb" value="SANITIZED"')
}

module.exports = { sanitizeHTML }
