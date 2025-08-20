const admin = require("../lib/firebaseAdmin.cjs");

module.exports = async (req, res) => {
  try {
    const id = await admin.messaging().send({
      notification: {
        title: "Weekly Game Drop 🎮",
        body: "This is a test push from Vercel ✅",
      },
      topic: "weekly-games",
    });
    res.status(200).json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};