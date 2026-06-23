/**
 * game.js - 酔いどれランナー（酒避けアクションゲーム）
 */

// ゲーム状態の定数
const GAME_STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover'
};

// お酒（障害物）とアイテムの定義
const ALCOHOL_TYPES = {
  taiwan_beer: {
    id: 'taiwan_beer',
    name: '台湾ビール',
    abv: 4,
    damage: 4,
    speedMult: 0.9,
    color: '#00f5d4', // エメラルドグリーン
    size: { w: 24, h: 48 },
    shape: 'can',
    desc: '薄味で飲みやすい。酔いは軽いが、油断は大敵。'
  },
  beer: {
    id: 'beer',
    name: 'ビール',
    abv: 5,
    damage: 5,
    speedMult: 1.0,
    color: '#ffb703', // ゴールド
    size: { w: 26, h: 50 },
    shape: 'mug',
    desc: '定番ののどごし。ついつい飲みすぎてしまう。'
  },
  highball: {
    id: 'highball',
    name: 'ハイボール',
    abv: 7,
    damage: 7,
    speedMult: 1.1,
    color: '#f39c12', // アンバー
    size: { w: 22, h: 46 },
    shape: 'glass-tall',
    desc: 'シュワっと爽快。炭酸のせいでアルコールの吸収が早いぞ。'
  },
  wine: {
    id: 'wine',
    name: 'ワイン',
    abv: 12,
    damage: 12,
    speedMult: 1.2,
    color: '#7209b7', // パープル
    size: { w: 24, h: 52 },
    shape: 'wine-glass',
    desc: 'お洒落な罠。フルーティーな香りに誘われて被弾しやすい。'
  },
  sake: {
    id: 'sake',
    name: '日本酒',
    abv: 15,
    damage: 15,
    speedMult: 1.0,
    color: '#f8f9fa', // 白
    size: { w: 20, h: 54 },
    shape: 'tokkuri',
    desc: '米の旨味と高い度数。ジワジワと足元をすくわれる。'
  },
  kuchikami: {
    id: 'kuchikami',
    name: '口噛み酒',
    abv: 18,
    damage: 18,
    speedMult: 0.8,
    color: '#ff70a6', // ピンク
    size: { w: 24, h: 44 },
    shape: 'pot',
    desc: 'いにしえの秘伝酒。噛み締めるほどに強烈な酔いが回る。'
  },
  shochu: {
    id: 'shochu',
    name: '焼酎',
    abv: 25,
    damage: 25,
    speedMult: 1.3,
    color: '#52b788', // グリーン
    size: { w: 22, h: 52 },
    shape: 'bottle',
    desc: 'ロックでガツンと。一気に意識を刈り取りにくる。'
  },
  rubbing_alcohol: {
    id: 'rubbing_alcohol',
    name: '消毒用アルコール',
    abv: 75,
    damage: 75,
    speedMult: 1.6,
    color: '#00b4d8', // ネオンブルー
    size: { w: 28, h: 56 },
    shape: 'rubbing',
    desc: '※飲用不可。当たれば即死級！絶対に避けて！'
  },
  water: {
    id: 'water',
    name: '水（チェイサー）',
    abv: 0,
    damage: -15, // 酔いを回復
    speedMult: 1.0,
    color: '#00f0ff', // シアン（発光）
    size: { w: 20, h: 40 },
    shape: 'water-bottle',
    desc: '命の水。酔いを覚まし、足取りを軽くする。'
  }
};

// ゲームクラス
class DrunkenRunner {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 450;
    this.height = 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.state = GAME_STATE.START;
    
    // スコア＆統計
    this.score = 0;
    this.drunkLevel = 0; // 0 to 100
    this.hitStats = {};
    this.fatalBlow = null; // とどめのお酒 ID
    
    // プレイヤー設定
    this.player = {
      x: this.width / 2,
      y: this.height - 100,
      radius: 20,
      targetX: this.width / 2,
      baseSpeed: 7,
      swayTimer: 0 // 千鳥足用のタイマー
    };
    
    // 障害物
    this.obstacles = [];
    this.nextSpawnTime = 0;
    this.baseSpawnInterval = 1200; // ms
    this.gameSpeed = 4;
    
    // キー入力状態
    this.keys = {};
    this.touchStartX = 0;
    this.isDragging = false;
    
    // パーティクル
    this.particles = [];
    
    // バインド
    this.initInput();
    this.resetGame();
    
    // ループ起動
    this.lastTime = performance.now();
    this.animate();
  }
  
  // 入力処理の初期化
  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // タッチ＆マウスドラッグでの操作（スマートフォン対応）
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== GAME_STATE.PLAYING) return;
      this.isDragging = true;
      this.handlePointerMove(e);
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || this.state !== GAME_STATE.PLAYING) return;
      this.handlePointerMove(e);
    });
    
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state !== GAME_STATE.PLAYING) return;
      this.isDragging = true;
      this.handlePointerMove(e.touches[0]);
    }, { passive: true });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging || this.state !== GAME_STATE.PLAYING) return;
      this.handlePointerMove(e.touches[0]);
    }, { passive: true });
    
    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }
  
  handlePointerMove(pointer) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    let clickX = (pointer.clientX - rect.left) * scaleX;
    
    // プレイヤーの目標Xをセット（境界内に収める）
    this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, clickX));
  }
  
  // ゲームリセット
  resetGame() {
    this.score = 0;
    this.drunkLevel = 0;
    this.fatalBlow = null;
    this.obstacles = [];
    this.particles = [];
    this.player.x = this.width / 2;
    this.player.targetX = this.width / 2;
    this.player.swayTimer = 0;
    this.gameSpeed = 4;
    
    // 被弾集計リセット
    Object.keys(ALCOHOL_TYPES).forEach(key => {
      if (key !== 'water') {
        this.hitStats[key] = 0;
      }
    });
    
    // 画面揺れ・ぼやけのリセット
    this.updateScreenDrunkEffects(0);
  }
  
  // ゲームスタート
  start() {
    this.resetGame();
    this.state = GAME_STATE.PLAYING;
    this.nextSpawnTime = performance.now() + 500;
  }
  
  // ゲームオーバー
  triggerGameOver() {
    this.state = GAME_STATE.GAMEOVER;
    this.updateScreenDrunkEffects(0); // 画面効果リセット
    
    // スコアと統計をローカルストレージに保存 (確実に実行されるようにtry-catchで保護)
    try {
      this.saveGameResult();
    } catch (e) {
      console.error("Failed to save score:", e);
    }
    
    // HTMLの表示を切り替え
    if (typeof window.showResultModal === 'function') {
      window.showResultModal(this.score, this.hitStats, this.fatalBlow);
    }
  }
  
  // 被弾エフェクト用のパーティクル
  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 4 + 2,
        color: color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.01
      });
    }
  }
  
  // 障害物のスポーン
  spawnObstacle() {
    const types = Object.keys(ALCOHOL_TYPES);
    // 消毒用アルコールの出現率を下げるなどの難易度調整
    let randomType = types[Math.floor(Math.random() * types.length)];
    if (randomType === 'rubbing_alcohol' && Math.random() > 0.25) {
      // 消毒用アルコールだったら75%の確率で別のものに再選択
      randomType = types[Math.floor(Math.random() * (types.length - 1))];
    }
    // 水の出現率調整 (少し低めにする)
    if (randomType === 'water' && Math.random() > 0.4) {
      randomType = types[Math.floor(Math.random() * (types.length - 1))];
    }
    
    const drink = ALCOHOL_TYPES[randomType];
    const x = Math.random() * (this.width - 60) + 30;
    
    this.obstacles.push({
      x: x,
      y: -60,
      type: drink,
      speed: (this.gameSpeed * drink.speedMult) + (Math.random() * 1),
      angle: 0,
      rotSpeed: (Math.random() - 0.5) * 0.05
    });
  }
  
  // 酔いによる画面の揺れとぼかしエフェクトの更新
  updateScreenDrunkEffects(drunk) {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    if (drunk <= 0) {
      container.style.filter = 'none';
      container.style.transform = 'none';
      return;
    }
    
    // ぼかし度数 (最大 4px)
    const blurPx = (drunk / 100) * 3.5;
    // 揺れ強度 (最大 10px / 5deg)
    const swayAngle = Math.sin(performance.now() / 250) * (drunk / 100) * 4;
    const swayX = Math.cos(performance.now() / 200) * (drunk / 100) * 8;
    
    container.style.filter = `blur(${blurPx}px)`;
    container.style.transform = `rotate(${swayAngle}deg) translateX(${swayX}px)`;
  }
  
  // スコア・走行距離・被弾数の確実な保存
  saveGameResult() {
    let user = window.Auth.getCurrentUser();
    if (!user) {
      user = 'ゲスト'; // ゲストのスコアも記録できるようにする
    }
    
    const finalScoreValue = Math.floor(this.score);
    if (finalScoreValue <= 0) return; // 0m以下のスコアは保存しない
    
    // 1. ハイスコアランキング保存
    const scoresKey = 'yoizakura_scores';
    let scores = [];
    try {
      scores = JSON.parse(localStorage.getItem(scoresKey) || '[]');
    } catch(e) {
      scores = [];
    }

    scores.push({
      user: user,
      score: finalScoreValue,
      date: new Date().toLocaleDateString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    });
    
    // スコア降順ソート、トップ15のみ保持
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(scoresKey, JSON.stringify(scores.slice(0, 15)));
    
    // 2. 累計被弾統計保存
    const statsKey = `yoizakura_stats_${user}`;
    let globalStats = {};
    try {
      globalStats = JSON.parse(localStorage.getItem(statsKey) || '{}');
    } catch(e) {
      globalStats = {};
    }
    
    Object.keys(this.hitStats).forEach(key => {
      globalStats[key] = (globalStats[key] || 0) + this.hitStats[key];
    });
    
    // 総走行距離、プレイ回数をカウント
    globalStats.totalDistance = (globalStats.totalDistance || 0) + finalScoreValue;
    globalStats.playCount = (globalStats.playCount || 0) + 1;
    
    localStorage.setItem(statsKey, JSON.stringify(globalStats));

    // 画面に保存された戦績データを更新するようイベント発火
    document.dispatchEvent(new CustomEvent('YoizakuraStatsUpdated', { detail: { user } }));
  }
  
  // 更新ロジック
  update(deltaTime) {
    if (this.state !== GAME_STATE.PLAYING) {
      if (this.state === GAME_STATE.START) {
        this.updateScreenDrunkEffects(0);
      }
      return;
    }
    
    // 時間経過でスコア（走行距離）増加。deltaTimeに基づき一定の割合で増加させる
    // 1秒間に約30m進むペース
    this.score += deltaTime * 0.03;
    
    // スピード緩やかに増加
    this.gameSpeed = 4 + (this.score / 200);
    
    // プレイヤー移動処理
    const speedRatio = Math.max(0.4, 1 - (this.drunkLevel / 100) * 0.6);
    const speed = this.player.baseSpeed * speedRatio;
    
    // 左右キー入力処理
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.player.targetX -= speed * 1.2;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.targetX += speed * 1.2;
    }
    
    // 目標Xを画面内に収める
    this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.targetX));
    
    // プレイヤーを目標位置に近づける (なめらかに移動)
    let dx = this.player.targetX - this.player.x;
    this.player.x += dx * 0.2;
    
    // 千鳥足 (Sway) システム
    if (this.drunkLevel > 10) {
      this.player.swayTimer += deltaTime * 0.003 * (this.drunkLevel / 50);
      const swayAmplitude = (this.drunkLevel / 100) * 45;
      const swayX = Math.sin(this.player.swayTimer) * swayAmplitude;
      this.player.x += swayX * 0.05;
      
      // 不規則なブレ
      if (Math.random() < 0.02 * (this.drunkLevel / 100)) {
        this.player.targetX += (Math.random() - 0.5) * 50;
      }
      
      // 壁に押し戻す
      this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
    }
    
    // 画面の酔っぱらい効果更新
    this.updateScreenDrunkEffects(this.drunkLevel);
    
    // パーティクルの更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 障害物の出現制御
    const now = performance.now();
    if (now >= this.nextSpawnTime) {
      this.spawnObstacle();
      const interval = Math.max(400, this.baseSpawnInterval - (this.score * 1.5));
      this.nextSpawnTime = now + interval + (Math.random() * 300);
    }
    
    // 障害物の更新と当たり判定
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += obs.speed;
      obs.angle += obs.rotSpeed;
      
      if (obs.y > this.height + 60) {
        this.obstacles.splice(i, 1);
        continue;
      }
      
      const obsRadius = (obs.type.size.w + obs.type.size.h) / 4;
      const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
      
      if (dist < this.player.radius + obsRadius) {
        const drink = obs.type;
        
        if (drink.id === 'water') {
          this.drunkLevel = Math.max(0, this.drunkLevel + drink.damage);
          this.spawnParticles(obs.x, obs.y, drink.color, 12);
        } else {
          this.drunkLevel = Math.min(100, this.drunkLevel + drink.damage);
          this.hitStats[drink.id]++;
          this.spawnParticles(obs.x, obs.y, drink.color, 15);
          
          if (this.drunkLevel >= 100) {
            this.fatalBlow = drink;
            this.triggerGameOver();
            return;
          }
        }
        
        this.obstacles.splice(i, 1);
      }
    }
  }
  
  // 描画ロジック
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 1. サイバーパンクグリッドの背景
    this.drawBackground();
    
    // 2. 障害物（お酒・水）の描画
    this.obstacles.forEach(obs => {
      this.drawDrink(obs);
    });
    
    // 3. パーティクルの描画
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
    
    // 4. プレイヤーの描画
    if (this.state === GAME_STATE.PLAYING) {
      this.drawPlayer();
    }
    
    // 5. ゲームUI（Canvas内）
    this.drawCanvasUI();
  }
  
  // スクロールする背景グリッド
  drawBackground() {
    const gridY = (this.score * 8) % 40;
    
    this.ctx.strokeStyle = 'rgba(255, 42, 133, 0.08)';
    this.ctx.lineWidth = 1;
    
    for (let y = gridY; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.beginPath();
    for (let x = -200; x < this.width + 200; x += 50) {
      this.ctx.moveTo(this.width / 2 + (x - this.width / 2) * 0.1, -100);
      this.ctx.lineTo(x, this.height + 100);
    }
    this.ctx.stroke();
    
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(30, 0);
    this.ctx.lineTo(30, this.height);
    this.ctx.moveTo(this.width - 30, 0);
    this.ctx.lineTo(this.width - 30, this.height);
    this.ctx.stroke();
  }
  
  // プレイヤーの描画
  drawPlayer() {
    this.ctx.save();
    
    const redIntensity = Math.min(255, Math.floor((this.drunkLevel / 100) * 200));
    const shadowColor = `rgb(${100 + redIntensity}, 0, 255)`;
    
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = shadowColor;
    
    const shakeY = (this.drunkLevel > 30) ? Math.sin(performance.now() / 80) * (this.drunkLevel / 20) : 0;
    
    this.ctx.fillStyle = `rgb(255, ${255 - redIntensity}, ${255 - redIntensity})`;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y + shakeY, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y + shakeY, this.player.radius + 3, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    
    const faceY = this.player.y + shakeY;
    if (this.drunkLevel > 70) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.x - 8, faceY - 5);
      this.ctx.lineTo(this.player.x - 2, faceY - 1);
      this.ctx.moveTo(this.player.x - 2, faceY - 5);
      this.ctx.lineTo(this.player.x - 8, faceY - 1);
      this.ctx.moveTo(this.player.x + 2, faceY - 5);
      this.ctx.lineTo(this.player.x + 8, faceY - 1);
      this.ctx.moveTo(this.player.x + 8, faceY - 5);
      this.ctx.lineTo(this.player.x + 2, faceY - 1);
      
      this.ctx.moveTo(this.player.x - 5, faceY + 6);
      this.ctx.quadraticCurveTo(this.player.x, faceY + 3, this.player.x + 5, faceY + 6);
      this.ctx.stroke();
    } else if (this.drunkLevel > 30) {
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(this.player.x - 5, faceY - 3, 2, 0, Math.PI * 2);
      this.ctx.arc(this.player.x + 5, faceY - 3, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, faceY + 5, 3, 0, Math.PI);
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(this.player.x - 5, faceY - 4, 2, 0, Math.PI * 2);
      this.ctx.arc(this.player.x + 5, faceY - 4, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, faceY + 1, 6, 0.1 * Math.PI, 0.9 * Math.PI);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  // ドリンク（障害物）の描画ロジック
  drawDrink(obs) {
    const drink = obs.type;
    const { w, h } = drink.size;
    
    this.ctx.save();
    this.ctx.translate(obs.x, obs.y);
    this.ctx.rotate(obs.angle);
    
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = drink.color;
    this.ctx.fillStyle = drink.color;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    
    this.ctx.beginPath();
    
    if (drink.shape === 'can') {
      this.roundRect(-w/2, -h/2, w, h, 4);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-w/2 + 3, -h/4, w - 6, 4);
    } 
    else if (drink.shape === 'mug') {
      this.roundRect(-w/2 - 2, -h/2 + 8, w - 4, h - 8, 4);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(w/2 - 2, 0, 8, -Math.PI/2, Math.PI/2);
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(-w/2 + 4, -h/2 + 8, 7, 0, Math.PI*2);
      this.ctx.arc(0, -h/2 + 6, 8, 0, Math.PI*2);
      this.ctx.arc(w/2 - 4, -h/2 + 8, 7, 0, Math.PI*2);
      this.ctx.fill();
    } 
    else if (drink.shape === 'glass-tall') {
      this.ctx.moveTo(-w/2, -h/2);
      this.ctx.lineTo(w/2, -h/2);
      this.ctx.lineTo(w/2 - 4, h/2);
      this.ctx.lineTo(-w/2 + 4, h/2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
      this.ctx.fillRect(-4, -h/4, 8, 8);
      this.ctx.fillRect(2, 2, 6, 6);
    } 
    else if (drink.shape === 'wine-glass') {
      this.ctx.arc(0, -h/4, w/2, 0, Math.PI);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, -h/4 + w/2);
      this.ctx.lineTo(0, h/2 - 2);
      this.ctx.moveTo(-w/3, h/2 - 2);
      this.ctx.lineTo(w/3, h/2 - 2);
      this.ctx.stroke();
    } 
    else if (drink.shape === 'tokkuri') {
      this.ctx.moveTo(-w/4, -h/2);
      this.ctx.lineTo(w/4, -h/2);
      this.ctx.quadraticCurveTo(w/4, -h/4, w/2, h/4);
      this.ctx.quadraticCurveTo(w/2, h/2, 0, h/2);
      this.ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/4);
      this.ctx.quadraticCurveTo(-w/4, -h/4, -w/4, -h/2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } 
    else if (drink.shape === 'pot') {
      this.ctx.arc(0, 4, w/2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-w/3, -h/2 + 2, (w/3)*2, 6);
    } 
    else if (drink.shape === 'rubbing' || drink.shape === 'bottle') {
      this.roundRect(-w/2, -h/6, w, h/2 + h/3, 4);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-w/4, -h/2 + 4, w/2, h/3 - 4);
      this.ctx.fillStyle = (drink.id === 'rubbing_alcohol') ? '#ff0000' : 'rgba(255,255,255,0.7)';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText((drink.id === 'rubbing_alcohol') ? '☠' : '🍶', 0, h/6);
    }
    else if (drink.shape === 'water-bottle') {
      this.roundRect(-w/2, -h/3, w, (h/3)*2, 3);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#00a8ff';
      this.ctx.fillRect(-w/3, -h/2, (w/3)*2, 6);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-w/2 + 1, -h/8, w - 2, 8);
    }
    
    this.ctx.restore();
  }
  
  roundRect(x, y, width, height, radius) {
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  // Canvas上にUI情報を描画
  drawCanvasUI() {
    if (this.state === GAME_STATE.PLAYING) {
      // 走行スコア (m)
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 20px "Montserrat", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${Math.floor(this.score)} m`, 20, 40);
      
      // 酔い度
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = this.drunkLevel > 70 ? '#ff2a85' : (this.drunkLevel > 40 ? '#ffd700' : '#ffffff');
      this.ctx.fillText(`酔い度: ${Math.floor(this.drunkLevel)}%`, this.width - 20, 40);
      
      // 酔い度ゲージバー
      const gaugeW = 150;
      const gaugeH = 8;
      const gaugeX = this.width - gaugeW - 20;
      const gaugeY = 52;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);
      
      let fillStyle = '#00f0ff';
      if (this.drunkLevel > 70) fillStyle = '#ff2a85';
      else if (this.drunkLevel > 40) fillStyle = '#ffd700';
      
      this.ctx.fillStyle = fillStyle;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = fillStyle;
      this.ctx.fillRect(gaugeX, gaugeY, (this.drunkLevel / 100) * gaugeW, gaugeH);
      this.ctx.shadowBlur = 0;
    }
  }
  
  // アニメーションループ
  animate() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    
    this.update(deltaTime);
    this.draw();
    
    requestAnimationFrame(() => this.animate());
  }
}

// 読み込み時初期化
document.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new DrunkenRunner('game-canvas');
});
