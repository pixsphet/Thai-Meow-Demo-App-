const express = require('express');
const { generateSpeech } = require('../controllers/tts.controller');

const router = express.Router();

router.post('/speak', generateSpeech);

module.exports = router;
