/**
 * Check if the given element exists in the DOM
 * @param  {String}  selector  Element selector
 * @param  {Boolean} falseCase Check if the element (does not) exists
 */
export default async (selector, falseCase) => {
  /**
   * The element found in the DOM
   * @type {string}
   */
  const element = await $(selector)

  if (falseCase === true) {
    await expect(element.elementId).to.be.a(
      'undefined',
      `Element with selector "${selector}" should not exist on the page`
    )
  } else {
    await expect(element.elementId).to.be.a(
      'string',
      `Element with selector "${selector}" should exist on the page`
    )
  }
}
