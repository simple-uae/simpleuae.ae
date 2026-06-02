const { model } = require('./pgdb');
const Log = model('logs');
exports.log = async (type, action, message, meta = {}) => {
  try { await Log.create({ type, action, message, meta }); }
  catch (e) { console.error('Logger error:', e.message); }
};
