/**
 * Safely escape special characters in a string for use in a Regular Expression.
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
export const escapeRegExp = (input: any): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
