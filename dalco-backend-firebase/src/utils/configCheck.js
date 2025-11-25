const REQUIRED_GROUPS = {
  firebase: [
    'FIREBASE_SERVICE_ACCOUNT_PATH',
  ],
  jamai: [
    'JAMAI_API_KEY',
    'JAMAI_PROJECT_ID',
    'JAMAI_BASE_URL',
    'JAMAI_INTENT_ACTION_TABLE_ID',
    'JAMAI_FAQ_KNOWLEDGE_TABLE_ID',
    'JAMAI_INVENTORY_ACTION_TABLE_ID',
    'JAMAI_ORDER_ACTION_TABLE_ID',
    'JAMAI_ANALYTICS_GENERATIVE_TABLE_ID',
  ],
  googleSheets: [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'GOOGLE_SHEETS_INVENTORY_RANGE',
    'GOOGLE_SHEETS_ORDER_RANGE',
  ],
};

const checkEnvGroup = (groupName) => {
  const keys = REQUIRED_GROUPS[groupName] || [];
  const missing = keys.filter((key) => !process.env[key] || process.env[key].trim() === '');

  return {
    group: groupName,
    total: keys.length,
    missing,
    satisfied: missing.length === 0,
  };
};

const getConfigReport = () => Object.keys(REQUIRED_GROUPS).map((group) => checkEnvGroup(group));

module.exports = {
  REQUIRED_GROUPS,
  checkEnvGroup,
  getConfigReport,
};

