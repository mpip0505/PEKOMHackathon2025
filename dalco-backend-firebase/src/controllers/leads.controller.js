const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../config/firebase');

const listLeads = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('messages')
      .where('intent', '==', 'order')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ success: true, data: leads });
  } catch (error) {
    return next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new',
    };

    const ref = await db.collection('leads').add(payload);

    return res.status(201).json({
      success: true,
      id: ref.id,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listLeads,
  createLead,
};

