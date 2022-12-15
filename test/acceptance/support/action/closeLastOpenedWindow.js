/**
 * Close the last opened window
 * @param  {String}   obsolete Type of object to close (window or tab)
 */

export default async (obsolete) => {
  /**
     * The last opened window handle
     * @type {Object}
     */
  const lastWindowHandle = await browser.getWindowHandles().slice(-1)[0]

  await browser.closeWindow()
  await browser.switchToWindow(lastWindowHandle)
}
