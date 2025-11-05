function doGet(e) {
  try {
    let output;
    if (!e.parameter || !e.parameter.action) {
      output = { status: 'error', message: 'Brak parametru action' };
    } else if (e.parameter.action === 'verify') {
      const token = e.parameter.token;
      output = verifyToken(token);
    } else {
      output = { status: 'error', message: 'Nieprawidłowe działanie' };
    }
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Błąd w doGet: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Brak danych w żądaniu POST' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    Logger.log('doPost - action: ' + action);

    if (action === 'register') {
      return registerUser(
        requestData.username,
        requestData.email,
        requestData.password,
        requestData.birthYear,
        requestData.gender,
        requestData.appData
      );
    } else if (action === 'login') {
      return loginUser(requestData.identifier, requestData.password);
    } else if (action === 'updateUserData') {
      return updateUserData(requestData.token, requestData.appData);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowe działanie' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Błąd w doPost: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function hashPassword(password) {
  if (!password) {
    throw new Error('Hasło nie może być puste');
  }
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return Utilities.base64Encode(digest);
}

function registerUser(username, email, password, birthYear, gender, appData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) {
    Logger.log('Arkusz Users nie istnieje');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Arkusz Users nie istnieje' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('registerUser - dane arkusza: ' + JSON.stringify(data));

  // Walidacja
  if (!username || username.length > 20 || username.includes(' ')) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Nazwa użytkownika musi mieć do 20 znaków i nie może zawierać spacji' 
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Hasło musi mieć co najmniej 8 znaków, dużą i małą literę, cyfrę oraz znak specjalny' 
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Nieprawidłowy format emaila' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (gender && !['M', 'F', 'O'].includes(gender)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Nieprawidłowa wartość płci. Dozwolone: M, F, O'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Parsowanie appData
  let userData;
  try {
    userData = appData ? JSON.parse(appData) : {};
  } catch (e) {
    Logger.log('Błąd parsowania appData: ' + e.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowy format danych użytkownika (appData)' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Sprawdzenie duplikatów
  for (let i = 1; i < data.length; i++) {
    let existingData;
    try {
      existingData = JSON.parse(data[i][1] || '{}');
    } catch (e) {
      Logger.log(`Błąd parsowania JSON w wierszu ${i + 1}: ${e.message}`);
      continue;
    }
    if (existingData.profile && (existingData.profile.username === username || (email && existingData.profile.email === email))) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nazwa użytkownika lub email już istnieje' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Dodanie hasła do appData
  userData.profile = userData.profile || {};
  userData.profile.password = hashPassword(password);

  // Generowanie tokena i zapisywanie danych
  const token = Utilities.base64Encode(username + ':' + Math.random().toString());
  sheet.appendRow([token, JSON.stringify(userData)]);
  Logger.log('registerUser - zapisano użytkownika: ' + username + ', token: ' + token);

  // Usunięcie hasła z odpowiedzi
  const responseData = JSON.parse(JSON.stringify(userData));
  if (responseData.profile) {
    delete responseData.profile.password;
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'success', 
    token: token, 
    appData: responseData 
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

function loginUser(identifier, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) {
    Logger.log('Arkusz Users nie istnieje');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Arkusz Users nie istnieje' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('loginUser - dane arkusza: ' + JSON.stringify(data));
  
  if (!identifier || !password) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nazwa użytkownika/email i hasło są wymagane' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  for (let i = 1; i < data.length; i++) {
    let appData;
    try {
      appData = JSON.parse(data[i][1] || '{}');
    } catch (e) {
      Logger.log(`Błąd parsowania JSON w wierszu ${i + 1}: ${e.message}`);
      continue;
    }
    if (appData.profile && (appData.profile.username === identifier || appData.profile.email === identifier) && appData.profile.password === hashPassword(password)) {
      const token = data[i][0];
      Logger.log('loginUser - sukces dla identifier: ' + identifier + ', token: ' + token);
      // Usunięcie hasła z odpowiedzi
      const responseData = JSON.parse(JSON.stringify(appData));
      if (responseData.profile) {
        delete responseData.profile.password;
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'success', 
        token: token, 
        appData: responseData 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  Logger.log('loginUser - niepowodzenie dla identifier: ' + identifier);
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowa nazwa użytkownika/email lub hasło' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifyToken(token) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) {
    Logger.log('Arkusz Users nie istnieje');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Arkusz Users nie istnieje' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('verifyToken - dane arkusza: ' + JSON.stringify(data));
  
  for (let i = 1; i < data.length; i++) {
    let appData;
    try {
      appData = JSON.parse(data[i][1] || '{}');
    } catch (e) {
      Logger.log(`Błąd parsowania JSON w wierszu ${i + 1}: ${e.message}`);
      continue;
    }
    if (data[i][0] === token) {
      Logger.log('verifyToken - sukces dla token: ' + token);
      // Usunięcie hasła z odpowiedzi
      const responseData = JSON.parse(JSON.stringify(appData));
      if (responseData.profile) {
        delete responseData.profile.password;
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'success', 
        verified: true,
        appData: responseData 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  Logger.log('verifyToken - nie znaleziono tokena: ' + token);
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowy token' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateUserData(token, appData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) {
    Logger.log('Arkusz Users nie istnieje');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Arkusz Users nie istnieje' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('updateUserData - dane arkusza: ' + JSON.stringify(data));
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      let userData;
      try {
        userData = appData ? JSON.parse(appData) : {};
      } catch (e) {
        Logger.log('Błąd parsowania appData: ' + e.message);
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowy format danych użytkownika (appData)' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Zachowaj istniejące hasło
      let existingData;
      try {
        existingData = JSON.parse(data[i][1] || '{}');
      } catch (e) {
        Logger.log(`Błąd parsowania JSON w wierszu ${i + 1}: ${e.message}`);
        existingData = {};
      }
      userData.profile = userData.profile || {};
      if (existingData.profile && existingData.profile.password) {
        userData.profile.password = existingData.profile.password;
      }

      // Zapisanie danych
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(userData));
      Logger.log('updateUserData - zapisano dane dla token: ' + token);
      // Usunięcie hasła z odpowiedzi
      const responseData = JSON.parse(JSON.stringify(userData));
      if (responseData.profile) {
        delete responseData.profile.password;
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', appData: responseData }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  Logger.log('updateUserData - nie znaleziono tokena: ' + token);
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nieprawidłowy token' }))
    .setMimeType(ContentService.MimeType.JSON);
}