/**
 * Focus the last opened window
 * @param  {String}   obsolete Type of object to focus to (window or tab)
 */

export default async (obsolete) => {
  /**
     * The last opened window
     * @type {Object}
     */
  const lastWindowHandle = browser.getWindowHandles().slice(-1)[0]
  await browser.switchToWindow(lastWindowHandle)
}
