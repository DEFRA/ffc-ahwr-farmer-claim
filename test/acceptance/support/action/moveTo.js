/**
 * Move to the given selector with an optional offset on a X and Y position
 * @param  {String}   selector  Element selector
 * @param  {String}   x        X coordinate to move to
 * @param  {String}   y        Y coordinate to move to
 */
export default async (selector, x, y) => {
  /**
     * X coordinate
     * @type {number}
   */
  const intX = parseInt(x, 10) || undefined

  /**
     * Y coordinate
     * @type {number}
   */
  const intY = parseInt(y, 10) || undefined

  await $(selector).moveTo(intX, intY)
}
