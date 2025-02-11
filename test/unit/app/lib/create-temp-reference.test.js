import { createTempClaimReference } from '../../../../app/lib/create-temp-claim-reference.js'

test('should return a string temp reference', () => {
  const tempRef = createTempClaimReference()

  expect(typeof tempRef).toBe('string')
  const regex = /^TEMP-CLAIM-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
  expect(tempRef).toMatch(regex)
})

test('should not generate the same ID twice in 20,000 IDs', () => {
  const ids = []
  const numberToCreate = 20000

  for (let index = 0; index < numberToCreate; index++) {
    ids.push(createTempClaimReference())
  }

  expect(ids.length).toEqual(numberToCreate)

  const set = new Set(ids)

  expect(set.size).toEqual(numberToCreate)
})
