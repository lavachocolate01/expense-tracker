const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // 用來綁定這筆帳目是屬於哪一個使用者的（資料隔離的核心）
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true }, // 收入或支出
  category: { type: String, default: '其他' }, // 加分項：餐飲、交通、娛樂等標籤
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);