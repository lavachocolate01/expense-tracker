// 全域狀態變數
let isLoginView = true;
let userToken = localStorage.getItem('token') || '';
let username = localStorage.getItem('username') || '';
let records = [];

// DOM 元素抓取
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const switchAuthBtn = document.getElementById('switch-auth-btn');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// 頁面初始化檢查
window.addEventListener('DOMContentLoaded', () => {
  if (userToken) {
    showMainDashboard();
  } else {
    showAuthView();
  }
});

// ==========================================
// 🔄 SPA 檢視畫面切換邏輯
// ==========================================
function showAuthView() {
  authView.classList.remove('hidden');
  mainView.classList.add('hidden');
}

function showMainDashboard() {
  authView.classList.add('hidden');
  mainView.classList.remove('hidden');
  userDisplayName.textContent = username;
  fetchRecords(); // 進入主畫面後非同步拉取自己的記帳資料
}

// 切換「登入」與「註冊」表單型態
switchAuthBtn.addEventListener('click', () => {
  isLoginView = !isLoginView;
  if (isLoginView) {
    authTitle.textContent = '會員登入';
    authSubmitBtn.textContent = '登入';
    switchAuthBtn.textContent = '還沒有帳號？前往註冊';
  } else {
    authTitle.textContent = '新會員註冊';
    authSubmitBtn.textContent = '註冊';
    switchAuthBtn.textContent = '已有帳號？前往登入';
  }
});

// ==========================================
// 🔐 登入與註冊表單送出（SPA fetch）
// ==========================================
authForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // 【核心要點】阻止網頁整頁重整！
  
  const inputUsername = document.getElementById('auth-username').value;
  const inputPassword = document.getElementById('auth-password').value;

  // 1. 【加分項：密碼長度前端限制】
  if (inputPassword.length < 6) {
    alert('前端警告：密碼長度不可少於 6 個字！');
    return;
  }

  const url = isLoginView ? '/api/login' : '/api/register';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '操作失敗');
    }

    if (isLoginView) {
      // 登入成功，保存 Token 憑證
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      userToken = data.token;
      username = data.username;
      alert('登入成功！');
      showMainDashboard();
    } else {
      // 註冊成功，自動跳回登入畫面
      alert('註冊成功，請重新登入！');
      isLoginView = true;
      authTitle.textContent = '會員登入';
      authSubmitBtn.textContent = '登入';
      switchAuthBtn.textContent = '還沒有帳號？前往註冊';
    }
    authForm.reset();

  } catch (error) {
    alert(error.message);
  }
});

// 登出邏輯
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  userToken = '';
  username = '';
  alert('已成功登出！');
  showAuthView();
});

// ==========================================
// 📊 記帳資料 CRUD 處理 (Fetch + 局部動態更新)
// ==========================================

// 1. 取得自己專屬的記帳資料 (R)
async function fetchRecords() {
  try {
    const response = await fetch('/api/accounts', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` } // 夾帶 Token 通行證
    });

    // 【未登入攔截評分點的前端對接】如果後端回傳 401，代表沒登入或憑證過期
    if (response.status === 401) {
      alert('未授權，請先登入！');
      logoutBtn.click(); // 強制退回登入
      return;
    }

    records = await response.json();
    renderDOM(); // 渲染資料庫資料到畫面上

  } catch (error) {
    console.error('撈取資料失敗:', error);
  }
}

// 2. 新增記帳明細 (C)
document.getElementById('account-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // 阻止表單重整網頁
  
  const title = document.getElementById('record-title').value;
  const amount = Number(document.getElementById('record-amount').value);
  const type = document.getElementById('record-type').value;
  const category = document.getElementById('record-category').value;

  try {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ title, amount, type, category })
    });

    if (!response.ok) throw new Error('新增失敗');

    document.getElementById('account-form').reset();
    fetchRecords(); // 重新拉取資料，局部重繪，網頁左上角不閃爍白畫面！

  } catch (error) {
    alert(error.message);
  }
});

// 3. 刪除記帳明細 (D)
async function deleteRecord(id) {
  if (!confirm('確定要刪除這筆帳目嗎？')) return;

  try {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (!response.ok) throw new Error('刪除失敗或無權限');
    
    fetchRecords(); // 重新整理列表，完全局部動態更新！

  } catch (error) {
    alert(error.message);
  }
}

// ==========================================
// 🧮 畫面動態渲染與【自動計算加分項】
// ==========================================
function renderDOM() {
  const tbody = document.getElementById('records-tbody');
  tbody.innerHTML = ''; // 清空原本的

  let incomeSum = 0;
  let expenseSum = 0;

  records.forEach(r => {
    // 累加計算收入與支出
    if (r.type === 'income') {
      incomeSum += r.amount;
    } else {
      expenseSum += r.amount;
    }

    // 動態建構表格列 (TR)
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.title}</td>
      <td><span class="badge bg-secondary">${r.category || '其他'}</span></td>
      <td><span class="badge ${r.type === 'income' ? 'bg-success' : 'bg-danger'}">${r.type === 'income' ? '收入' : '支出'}</span></td>
      <td class="${r.type === 'income' ? 'text-success' : 'text-danger'} font-weight-bold">${r.type === 'income' ? '+' : '-'}$${r.amount}</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${r._id}')">刪除</button></td>
    `;
    tbody.appendChild(tr);
  });

  // 【加分項：自動即時計算總和並呈現】
  document.getElementById('total-income').textContent = `$${incomeSum}`;
  document.getElementById('total-expense').textContent = `$${expenseSum}`;
  document.getElementById('total-balance').textContent = `$${incomeSum - expenseSum}`;
}