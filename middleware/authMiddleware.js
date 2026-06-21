const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. 從前端發過來的請求表頭（Headers）拿通行證 (Authorization)
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // 格式通常是: Bearer <TOKEN>

  // 2. 如果根本沒有 Token，直接無情攔截，回傳 401 狀態碼
  if (!token) {
    return res.status(401).json({ message: '未授權：請先登入！' });
  }

  try {
    // 3. 驗證 Token 是不是真的、有沒有過期
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. 【隔離核心】把解析出來的用戶 ID 塞進 req.user，傳給後續的 API 使用
    req.user = verified; 
    
    next(); // 檢查通過，放行！
  } catch (error) {
    res.status(401).json({ message: '憑證無效或已過期，請重新登入！' });
  }
};