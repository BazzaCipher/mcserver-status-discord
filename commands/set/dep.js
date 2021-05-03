/**
 * Tests the input against regex
 */

const { score } = require('fuzzaldrin');

function isValid(prop, val) {
  if (!prop || !val) return false;

  switch (prop) {
    case 'prefix':
    default:
      return /\S+/.test(val);
  }
}

function coerceInput(prop, input) {
  switch (prop) {
    case 'prefix': // I don't ignore this case
    default:
      return input;
  }
}

function revertCamelcase(string) {
  if (typeof string !== 'string') { throw new Error(`'${string}' is not a string`); }

  return string
    .split(/(?=[A-Z])/)
    .map((e, i) => (i === 0 ? e.replace(/^([a-z])/, (v) => v.toUpperCase()) : e))
    .join(' ');
}

// Look at what your brother did, and look at you
function closestSetting(object, property, lowerLimit = 0.1, returnScore = false) {
  const resultArr = [];

  Object.entries(object).forEach((entry) => {
    const [prop] = entry;
    resultArr.push({
      prop,
      score: score(prop, property),
    });
  });

  const closestVal = resultArr.sort((a, b) => b.score - a.score).shift();

  return closestVal.score > lowerLimit
    ? closestVal[returnScore ? 'score' : 'prop']
    : null;
}

module.exports = {
  isValid,
  coerceInput,
  revertCamelcase,
  closestSetting,
};
