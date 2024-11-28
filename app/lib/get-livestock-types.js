const { livestockTypes } = require('../constants/claim')

const getLivestockTypes = (typeOfLivestock) => {
  const { beef, dairy, pigs, sheep } = livestockTypes
  return {
    isBeef: typeOfLivestock === beef,
    isDairy: typeOfLivestock === dairy,
    isPigs: typeOfLivestock === pigs,
    isSheep: typeOfLivestock === sheep
  }
}

module.exports = {
  getLivestockTypes
}
