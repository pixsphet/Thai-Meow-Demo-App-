const express = require('express');
const Player = require('../models/Player');
const router = express.Router();

// Get or create Player
router.get('/player', async (req, res) => {
  const { userId = 'demo' } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  let p = await Player.findOne({ userId }).lean();
  if (!p) {
    p = await Player.create({ userId });
  }
  res.json(p);
});

// Update wallet/level/streak/summary safely
router.post('/player', async (req, res) => {
  const { userId, patch } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const doc = await Player.findOneAndUpdate(
    { userId },
    { $set: patch },
    { upsert: true, new: true }
  ).lean();

  res.json({ ok: true, player: doc });
});

// update streak (call daily login or when opening app)
router.post('/player/streak/tick', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const p = await Player.findOne({ userId });
  if (!p) return res.status(404).json({ error: 'player not found' });

  const today = new Date(); today.setHours(0,0,0,0);
  const last = p.streak.lastLoginDate ? new Date(p.streak.lastLoginDate) : null;
  if (last) last.setHours(0,0,0,0);

  let cur = p.streak.current || 0;
  let best = p.streak.best || 0;

  // diff วัน
  let changed = false;
  if (!last) { cur = 1; changed = true; }
  else {
    const diff = (today - last) / (1000*60*60*24);
    if (diff === 0) { /* same day → no change */ }
    else if (diff === 1) { cur += 1; changed = true; }
    else if (diff > 1)  { cur = 1; changed = true; }
  }

  if (changed) best = Math.max(best, cur);

  await Player.updateOne(
    { userId },
    { 
      $set: { 'streak.current': cur, 'streak.best': best, 'streak.lastLoginDate': today }
    }
  );

  res.json({ ok: true, current: cur, best });
});

module.exports = router;
