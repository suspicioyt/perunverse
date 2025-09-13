function getLocalData(section, key) {
  const localData = localStorage.getItem('userData');
  if (!localData) {
    console.log('getLocalData: No userData in localStorage');
    return null;
  }

  try {
    const parsedData = JSON.parse(localData);
    const value = parsedData[section]?.[key] ?? null;
    console.log(`getLocalData: Retrieved value=${value} for section=${section}, key=${key}`);
    return value;
  } catch (error) {
    console.error('getLocalData: Error parsing userData:', error);
    return null;
  }
}

async function setLocalData(section, key, value) {
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
    console.log('setLocalData: Updated userData in localStorage:', parsedData);
  } catch (storageError) {
    console.error('setLocalData: Error writing to localStorage:', storageError);
    throw storageError;
  }

  try {
    await saveUserDataToSheet(); // Assuming you want to sync with the server
    console.log('setLocalData: Data saved to sheet');
    return parsedData;
  } catch (error) {
    console.error('setLocalData: Error saving data to sheet:', error);
    throw error;
  }
}

const { getLocalData, setLocalData } = window.userLocalData;