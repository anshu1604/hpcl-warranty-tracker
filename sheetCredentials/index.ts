const SHEET_ID = '1kOxeQOA5NwBE19ycIYX-dOcjcKCYpDVPSAyLruGR0Y8';
const API_KEY = 'AIzaSyCG3LS71Ze22b-r_aqwzSYN_XUwsk6UfA0';
const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbyx5qKXSHibRr3nVL6nt6ESkmhn2s4gSB4A-02kr7c6Qmvr5pMEfuWqHfNhxFsjIE-Jug/exec';
const userList = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Users!A:H?key=${API_KEY}`;
const itemsList = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Items!A:S?key=${API_KEY}`;
const itemMasterData = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/ItemMasterData!A:D?key=${API_KEY}`;
const makeMasterData = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/MakeMasterData!A:B?key=${API_KEY}`;
const outletMasterData = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/OutletMasterData!A:D?key=${API_KEY}`;
const workTypeMasterData = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/WorkTypeMasterData!A:D?key=${API_KEY}`;

export const Google_Sheet_Creds = {
  SHEET_ID,
  API_KEY,
  WEB_APP_URL,
  userList,
  itemsList,
  itemMasterData,
  makeMasterData,
  outletMasterData,
  workTypeMasterData,
};
