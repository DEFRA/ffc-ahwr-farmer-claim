/**
 * Close all but the first tab
 * @param  {String}   obsolete Type of object to close (window or tab)
 */

export default async (obsolete) => {
  /**
     * Get all the window handles
     * @type {Object}
     */
  const windowHandles = browser.getWindowHandles()

  // Close all tabs but the first one
  await windowHandles.reverse()
  await windowHandles.forEach((handle, index) => {
    browser.switchToWindow(handle)
    if (index < windowHandles.length - 1) {
      browser.closeWindow()
    }
  })
}
