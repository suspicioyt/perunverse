function getLocalData(section, key) {
  const localData = localStorage.getItem('userData');
  if (!localData) {
    console.log('getLocalData: No userData in localStorage');
    return null;
  }

  try {
    const parsedData = JSON.parse(localData);
    const value = parsedData[section]?.[key] ?? null;
    return value;
  } catch (error) {
    console.error('getLocalData: Error parsing userData:', error);
    return null;
  }
}

function setLocalData(section, key, value) {
  let parsedData = {};
  const localData = localStorage.getItem('userData');

  try {
    parsedData = localData ? JSON.parse(localData) : {};
  } catch (error) {
    console.error('setLocalData: Error parsing userData:', error);
  }

  parsedData[section] = parsedData[section] || {};
  parsedData[section][key] = value;

  try {
    localStorage.setItem('userData', JSON.stringify(parsedData));
    return parsedData;
  } catch (storageError) {
    console.error('setLocalData: Error writing to localStorage:', storageError);
    throw storageError;
  }
}

//setLocalData('settings', 'theme', theme);
//const savedTheme = getLocalData('settings', 'theme') || 'light';