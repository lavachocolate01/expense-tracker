const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const authMiddleware = require('../middleware/authMiddleware');

// 讓這個檔案裡所有的動作（查、增、刪）都要先經過保全檢查
router.use(authMiddleware);

// 👉 1. 獲取當前登入使用者的所有記帳（查）
router.get('/', async (req, res) => {
  try {
    // 關鍵：只查詢 userId 等於當前登入者 ID 的記帳資料！ (資料隔離)
    const myRecords = await Account.find({ userId: req.user.userId }).sort({ date: -1 });
    res.json(myRecords);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 👉 2. 新增一筆記帳資料（增）
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category } = req.body;
    
    const newRecord = new Account({
      userId: req.user.userId, // 保全解析出來的用戶 ID
      title,
      amount,
      type,
      category
    });

    await newRecord.save();
    res.status(201).json({ message: '記帳成功！', data: newRecord });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 👉 3. 刪除指定記帳資料（刪）
router.delete('/:id', async (req, res) => {
  try {
    // 刪除時同樣要比對 userId，防止使用者透過操作 API 刪到別人的帳
    const deletedRecord = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!deletedRecord) {
      return res.status(404).json({ message: '找不到該筆帳目或您無權刪除' });
    }

    res.json({ message: '帳目已成功刪除！' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;