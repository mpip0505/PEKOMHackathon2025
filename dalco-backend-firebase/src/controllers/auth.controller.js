const { auth } = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken required' });
    }

    const decoded = await auth.verifyIdToken(idToken);
    return res.json({ success: true, user: decoded });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  verifyFirebaseToken,
};

