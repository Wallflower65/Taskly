const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { validateAuth } = require('../middleware/validate');

router.post('/signup', validateAuth, signup);
router.post('/login', validateAuth, login);

module.exports = router;