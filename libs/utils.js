const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const arrayToObj = (arr) => {
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
};

const flattenObject = (obj, prefix = '') => {
  const flattened = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}:${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattened.push(...flattenObject(obj[key], newKey));
      } else {
        flattened.push(newKey, String(obj[key]));
      }
    }
  }
  return flattened;
};

const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      sanitized[field] = obj[field];
    }
  });
  return sanitized;
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

module.exports = {
  slugify,
  arrayToObj,
  flattenObject,
  sanitizeObject,
  generateId,
};
