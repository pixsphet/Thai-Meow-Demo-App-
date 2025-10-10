const express = require('express');
const router = express.Router();
const { login, register, resetPasswordWithPet } = require('../controllers/auth.controller');
const { forceResetDemo } = require('../controllers/dev.controller');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password-with-pet', resetPasswordWithPet);

// DEV ONLY: reset demo user
router.post('/dev/force-reset-demo', forceResetDemo);

module.exports = router;