export const flattenOldStructure = (node, prefix = '') => {
  const result = {};
  Object.entries(node).forEach(([key, val]) => {
    if (typeof val === 'string') {
      result[prefix ? `${prefix}/${key}` : key] = val;
    } else if (val && typeof val === 'object') {
      const sub = key === 'root' ? '' : (prefix ? `${prefix}/${key}` : key);
      Object.assign(result, flattenOldStructure(val, sub));
    }
  });
  return result;
};

export const parseMapData = (jsonString) => {
  const data = JSON.parse(jsonString);
  if (data.files) return data;
  return { ...data, files: data.structure ? flattenOldStructure(data.structure) : {} };
};

export const groupByDir = (files) => {
  const groups = {};
  Object.keys(files).sort().forEach(path => {
    const dir = path.includes('/') ? path.split('/')[0] : '(root)';
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(path);
  });
  return groups;
};
