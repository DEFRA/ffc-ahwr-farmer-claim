const { livestockTypes } = require('../constants/claim')

const isSpecies = (typeOfLivestock, species) => {
  return typeOfLivestock === species
}

const getLivestockTypes = (typeOfLivestock) => {
  const { beef, dairy, pigs, sheep } = livestockTypes
  return {
    isBeef: isSpecies(typeOfLivestock, beef),
    isDairy: isSpecies(typeOfLivestock, dairy),
    isPigs: isSpecies(typeOfLivestock, pigs),
    isSheep: isSpecies(typeOfLivestock, sheep)
  }
}

module.exports = {
  getLivestockTypes
}
