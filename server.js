require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// 解析 JSON 請求與開放前端靜態檔案夾
app.use(express.json());
app.use(express.static('public')); // 我們下一階段會把網頁放在 public 資料夾

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🍃 MongoDB 連線成功！'))
  .catch(err => console.error('❌ 資料庫連線失敗:', err));

// 引入並掛載路由
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');

app.use('/api', authRoutes);         // 註冊、登入路徑
app.use('/api/accounts', accountRoutes); // 記帳路徑

// Port 設定（優先讀取環境變數，符合 Render 部署規範）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 伺服器正在主機埠 ${PORT} 上運行...`);
});