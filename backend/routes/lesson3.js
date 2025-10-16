const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getLesson3Vocab,
  postLesson3Completion,
} = require('../controllers/lesson3.controller');

router.get('/vocab/lesson3', getLesson3Vocab);
router.post('/progress/lesson3/complete', auth, postLesson3Completion);

module.exports = router;
