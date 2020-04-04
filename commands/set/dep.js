/**
 * Tests the input against regex
 */

const { score } = require('fuzzaldrin')
const moment = require('moment')

const isValid = function(prop, val) {

    if (!prop || !val) return false

    switch(prop) {
        case 'prefix':
        default:
            return /\S+/.test(val)
    }

}

const coerceInput = function(prop, input) {

    switch(prop) {
        case 'prefix':  // I don't ignore this case
        default:
            return input
    }

}

const revertCamelcase = function(string) {

    if (typeof string !== 'string')
        throw new Error(`'${string}' is not a string`)

    return string
        .split(/(?=[A-Z])/)
        .map((e, i) => i === 0 ? e.replace(/^([a-z])/, v => v.toUpperCase()) : e)
        .join(' ')

}

// Look at what your brother did, and look at you
const closestSetting = function(object, property, lowerLimit = 0.1, returnScore = false) {

    const resultArr = []

    for (let prop in object) {
        resultArr.push({
            prop,
            score: score(prop, property)
        })
    }

    const closestVal = resultArr.sort((a, b) => b.score - a.score).shift()
    
    return closestVal.score > lowerLimit ? 
        closestVal[returnScore? 'score': 'prop'] :
        null

}

module.exports = {
    isValid,
    coerceInput,
    revertCamelcase,
    closestSetting
}