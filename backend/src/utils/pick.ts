/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */

const pick = (
  object: Record<string, any>,
  keys: string[],
): Record<string, any> => {
  return keys.reduce((obj: Record<string, any>, key: string) => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export default pick;
