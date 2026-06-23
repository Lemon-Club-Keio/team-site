/**
 * auth.js - BAR 宵桜 簡易認証管理スクリプト (page1 完結対応版)
 */

const AUTH_KEYS = {
  CURRENT_USER: 'yoizakura_logged_in_user',
  USERS_LIST: 'yoizakura_registered_users'
};

// 初期ユーザー登録
function initUsers() {
  let users = localStorage.getItem(AUTH_KEYS.USERS_LIST);
  if (!users) {
    // デフォルト管理者アカウント
    users = JSON.stringify({
      'admin': 'password'
    });
    localStorage.setItem(AUTH_KEYS.USERS_LIST, users);
  }
}

initUsers();

const Auth = {
  // 現在ログイン中のユーザーを取得
  getCurrentUser() {
    return localStorage.getItem(AUTH_KEYS.CURRENT_USER);
  },

  // ログイン処理
  login(username, password) {
    if (!username || !password) {
      throw new Error('ユーザー名とパスワードを入力してください。');
    }
    
    const users = JSON.parse(localStorage.getItem(AUTH_KEYS.USERS_LIST) || '{}');
    if (users[username] && users[username] === password) {
      localStorage.setItem(AUTH_KEYS.CURRENT_USER, username);
      return username;
    } else {
      throw new Error('ユーザー名またはパスワードが正しくありません。');
    }
  },

  // 新規アカウント登録処理
  register(username, password) {
    if (!username || !password) {
      throw new Error('ユーザー名とパスワードを入力してください。');
    }
    
    if (username.length < 3) {
      throw new Error('ユーザー名は3文字以上で入力してください。');
    }
    
    if (password.length < 4) {
      throw new Error('パスワードは4文字以上で入力してください。');
    }

    const users = JSON.parse(localStorage.getItem(AUTH_KEYS.USERS_LIST) || '{}');
    if (users[username]) {
      throw new Error('このユーザー名は既に登録されています。');
    }

    users[username] = password;
    localStorage.setItem(AUTH_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, username);
    return username;
  },

  // ログアウト処理
  logout() {
    localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    // ゲームのある page1/index.html または現在のページをリロード
    const isPage1 = window.location.pathname.includes('page1/');
    if (isPage1) {
      window.location.reload();
    } else {
      // page1/index.html に戻してリロードさせる
      const rootPath = window.location.pathname.includes('page2/') ? '../page1/index.html' : 'page1/index.html';
      window.location.href = rootPath;
    }
  },

  // ヘッダーのログイン状態表示を更新
  updateHeaderAuth() {
    const user = this.getCurrentUser();
    const navNav = document.querySelector('.site-nav');
    if (!navNav) return;

    // 既存の nav-auth があれば削除
    let navAuth = document.querySelector('.nav-auth');
    if (navAuth) {
      navAuth.remove();
    }

    navAuth = document.createElement('div');
    navAuth.className = 'nav-auth';

    if (user) {
      navAuth.innerHTML = `
        <span class="user-display">👤 ${user}</span>
        <button id="logout-btn" class="btn-auth">Logout</button>
      `;
    } else {
      navAuth.innerHTML = `
        <button id="login-nav-btn" class="btn-auth">Login</button>
      `;
    }

    navNav.appendChild(navAuth);

    // イベントリスナーの付与
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    const loginNavBtn = document.getElementById('login-nav-btn');
    if (loginNavBtn) {
      loginNavBtn.addEventListener('click', () => {
        // 現在 page1 にいる場合はログインモーダルを表示
        const isPage1 = window.location.pathname.includes('page1/');
        if (isPage1) {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'flex';
        } else {
          // 違うページにいる場合は page1 に遷移してログインをトリガー
          const path = window.location.pathname.includes('page2/') ? '../page1/index.html?showLogin=true' : 'page1/index.html?showLogin=true';
          window.location.href = path;
        }
      });
    }
  }
};

// ページ読み込み時にヘッダーを更新
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateHeaderAuth();
  
  // URLクエリパラメータの確認
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('showLogin') === 'true') {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'flex';
  }
});

// グローバルスコープに公開
window.Auth = Auth;
