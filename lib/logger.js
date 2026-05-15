const { model } = require('./jsondb');
const Log = model('Log');

exports.log = async (type, action, message, meta = {}) => {
  try {
    await Log.create({ type, action, message, meta });
  } catch (e) {
    console.error('Logger error:', e.message);
  }
};
