const pluralize = require('pluralize');

const name = process.argv[2]; // Fetching the name from command-line argument

if (!name) {
  console.error('Please provide a name as argument.'); // eslint-disable-line no-console
  process.exit(1);
}

let plural = null;
let singular = null;

if (pluralize.isSingular(name)) {
  singular = name;
  plural = pluralize.plural(name);
} else {
  plural = name;
  singular = pluralize.singular(name);
}

const toDashed = (str) => str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
const toLower = (str) => str.toLowerCase();
const toUnderscore = (str) => str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
const toUpperCaseUnderscored = (str) => str.replace(/([A-Z])/g, (match) => `_${match.toUpperCase()}`).toUpperCase();
const toCapitalized = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toSpaceSeparated = (str) => {
  const result = str.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
};

const singularDashed = toDashed(singular);
const pluralDashed = toDashed(plural);

const singularCapitalizedDashed = singularDashed.toUpperCase();
const pluralCapitalizedDashed = pluralDashed.toUpperCase();

const singularUnderscored = toUnderscore(singular);
const pluralUnderscored = toUnderscore(plural);

const singularCapitalizedUnderscored = toUpperCaseUnderscored(singular);
const pluralCapitalizedUnderscored = toUpperCaseUnderscored(plural);

const singularCapitalized = toCapitalized(singular);
const pluralCapitalized = toCapitalized(plural);

const singularSpaceSeparated = toSpaceSeparated(singular);
const pluralSpaceSeparated = toSpaceSeparated(plural);

const singularSpaceSeparatedLowerCase = toLower(toSpaceSeparated(singular));
const pluralSpaceSeparatedLowerCase = toLower(toSpaceSeparated(plural));

/* eslint-disable no-console */
const data = {
  singular,
  plural,
  singularDashed,
  pluralDashed,
  singularCapitalizedDashed,
  pluralCapitalizedDashed,
  singularUnderscored,
  pluralUnderscored,
  singularCapitalizedUnderscored,
  pluralCapitalizedUnderscored,
  singularCapitalized,
  pluralCapitalized,
  singularSpaceSeparated,
  pluralSpaceSeparated,
  singularSpaceSeparatedLowerCase,
  pluralSpaceSeparatedLowerCase,
};
console.log(JSON.stringify(data));
/* eslint-enable no-console */
