import checkIfElementExists from '../lib/checkIfElementExists'

/**
 * Perform an click action on the given element
 * @param  {String}   action  The action to perform (click or doubleClick)
 * @param  {String}   type    Type of the element (link or selector)
 * @param  {String}   selector Element selector
 */
export default async (action, type, selector) => {
  /**
     * Element to perform the action on
     * @type {String}
     */
  const selector2 = await (type === 'link') ? `=${selector}` : selector

  /**
     * The method to call on the browser object
     * @type {String}
     */
  const method = await (action === 'click') ? 'click' : 'doubleClick'

  await checkIfElementExists(selector2)

  await $(selector2)[method]()
}
