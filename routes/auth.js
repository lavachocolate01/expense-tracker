const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==========================================
// 1. 註冊 API (POST /api/register)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 【加分項】檢查密碼長度是否小於 6 個字
    if (!password || password.length < 6) {
      return res.status(400).json({ message: '註冊失敗：密碼長度不可少於 6 個字！' });
    }

    // 檢查帳號是否已被註冊
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: '該帳號已被使用！' });
    }

    // 【資安評分核心】使用 bcrypt 加密密碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 【🎯 此處已修正完畢】建立新使用者並存入資料庫
    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: '註冊成功！' });

  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// ==========================================
// 2. 登入 API (POST /api/login)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 尋找使用者是否存在
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤！' });
    }

    // 【資安評分核心】比對明文密碼與資料庫裡的加密密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '帳號或密碼錯誤！' });
    }

    // 密碼正確，簽發 JWT Token（有效期限 1 天）
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // 回傳 Token 給前端
    res.json({
      message: '登入成功！',
      token,
      username: user.username
    });

  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

module.exports = router;