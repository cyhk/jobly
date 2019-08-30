/**
 * Function to take out unneeded keys from object
 * 
 * Input: { neededItem, item, ...}, [ neededKey, ...]
 * Output: { neededItem, ...}
 */
function cleanItems(items, neededKeys) {
  const cleanedItems = {};
  for (let key of neededKeys) {
    if (items[key] === undefined) continue;
    cleanedItems[key] = items[key];
  }
  return cleanedItems;
}

module.exports = cleanItems;