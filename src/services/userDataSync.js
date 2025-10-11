// src/services/userDataSync.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { AppState } from 'react-native';
import io from 'socket.io-client';

/**
 * CONFIG (ปรับตาม backend ของคุณ)
 */
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://thai-meow-backend.vercel.app';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE;

// storage keys
const KS = {
  LOCAL: 'userDataSync.local',
  QUEUE: 'userDataSync.queue',
  TOKEN: 'auth.token',
};

// ---- utils ----
const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * in-memory state (singletons)
 */
let socket = null;
let connected = false;
let _subscribers = new Set();
let _pendingQueue = []; // { type:'patch', payload, ts }
let _lastPushedAt = 0;
let _debounceTimer = null;
let _throttleWindow = 600; // ms
let _appState = AppState.currentState;
let _netOnline = true;
let _userId = null;

/**
 * --------- Public API ----------
 *  init(userId)
 *  subscribe(cb) -> unsubscribe()
 *  getLocal()
 *  updateUserStats(patch)
 *  forcePull()
 *  destroy()
 */

const UserDataSync = {
  /**
   * เริ่มระบบ realtime + โหลด state แรก
   */
  async init(userId) {
    _userId = userId;
    await _hydrateFromStorage();

    // network monitor
    NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      _netOnline = online;
      if (online) {
        this.flushQueue();
        this.forcePull(); // sync ล่าสุดจากเซิร์ฟเวอร์
      }
    });

    // app state (background/foreground)
    AppState.addEventListener('change', (next) => {
      const wasBackground = _appState !== 'active' && next === 'active';
      _appState = next;
      if (wasBackground) {
        this.forcePull();
        this.flushQueue();
      }
    });

    // connect socket
    await this._connectSocket();
    // ดึงข้อมูลล่าสุดจาก server หนึ่งรอบ
    await this.forcePull();

    return this.getLocal();
  },

  /**
   * สมัครฟังการเปลี่ยนแปลงข้อมูล (ทุกหน้าใช้ร่วมกัน)
   */
  subscribe(cb) {
    _subscribers.add(cb);
    // ส่งค่าเริ่มต้นให้ทันที
    (async () => cb(await this.getLocal()))();
    return () => _subscribers.delete(cb);
  },

  /**
   * อ่านข้อมูล local ปัจจุบัน
   */
  async getLocal() {
    const raw = await AsyncStorage.getItem(KS.LOCAL);
    return raw ? JSON.parse(raw) : { xp: 0, diamonds: 0, hearts: 5, level: 1, updatedAt: null };
  },

  /**
   * พยายามดึงจาก server (pull) แล้ว merge ตาม updatedAt (last-write-wins)
   */
  async forcePull() {
    try {
      const token = (await AsyncStorage.getItem(KS.TOKEN)) || '';
      const res = await axios.get(`${API_BASE}/api/user/stats/${_userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res?.data) return;

      const serverSnapshot = res.data?.stats || res.data?.data || res.data;
      if (!serverSnapshot) return;

      const serverData = { ...serverSnapshot, updatedAt: serverSnapshot.updatedAt || nowIso() };
      const local = await this.getLocal();
      const merged = this._resolveConflict(local, serverData);

      await AsyncStorage.setItem(KS.LOCAL, JSON.stringify(merged));
      this._emit(merged);
    } catch (e) {
      // เงียบไว้ – อาจออฟไลน์
      console.log('forcePull error', e?.message);
    }
  },

  /**
   * อัปเดตข้อมูลฝั่ง client -> queue -> debounced push
   * ส่งค่าเป็น delta เช่น { xp: +10, hearts: -1 }
   */
  async updateUserStats(delta) {
    const local = await this.getLocal();
    const baseMaxHearts = local.maxHearts ?? 5;
    const targetMaxHearts = clamp(
      delta.maxHearts !== undefined ? delta.maxHearts : baseMaxHearts,
      1,
      10
    );
    const nextHearts = clamp(
      (local.hearts ?? targetMaxHearts) + (delta.hearts || 0),
      0,
      targetMaxHearts
    );

    const merged = {
      ...local,
      xp: (local.xp || 0) + (delta.xp || 0),
      diamonds: (local.diamonds || 0) + (delta.diamonds || 0),
      hearts: nextHearts,
      maxHearts: targetMaxHearts,
      level: delta.level ? delta.level : (local.level || 1),
      accuracy: delta.accuracy ?? local.accuracy,
      streak: delta.streak ?? local.streak,
      maxStreak: Math.max(local.maxStreak || 0, delta.maxStreak || 0),
      completedQuestions: (local.completedQuestions || 0) + (delta.completedQuestions || 0),
      correctAnswers: (local.correctAnswers || 0) + (delta.correctAnswers || 0),
      wrongAnswers: (local.wrongAnswers || 0) + (delta.wrongAnswers || 0),
      totalQuestions: delta.totalQuestions ?? local.totalQuestions,
      timePerQuestion: delta.timePerQuestion || local.timePerQuestion,
      totalTimeSpent: delta.totalTimeSpent ?? local.totalTimeSpent,
      lastGameResults: delta.lastGameResults || local.lastGameResults,
      updatedAt: nowIso(),
    };

    await AsyncStorage.setItem(KS.LOCAL, JSON.stringify(merged));
    this._queue({ type: 'patch', payload: merged });
    this._emit(merged);

    // debounce + throttle push
    this._debouncedPush();
    return merged;
  },

  /**
   * ล้างคิว (เมื่อกลับมาออนไลน์หรือ socket connect)
   */
  async flushQueue() {
    if (!_netOnline) return;
    await this._pushLoop(); // ใช้ภายในดูแล retry/backoff
  },

  /**
   * ปิดระบบ (ตอน logout)
   */
  async destroy() {
    if (socket) {
      socket.offAny();
      socket.disconnect();
      socket = null;
    }
    _subscribers.clear();
  },

  // -------------- internal --------------

  async _connectSocket() {
    if (socket) return;

    const token = (await AsyncStorage.getItem(KS.TOKEN)) || '';
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,         // base
      reconnectionDelayMax: 5000,     // cap
      query: { token, userId: _userId },
      forceNew: true,
    });

    socket.on('connect', async () => {
      connected = true;
      console.log('🔌 Socket connected');
      // join room เฉพาะ user
      socket.emit('presence:join', { userId: _userId });
      // sync ล่าสุด
      await this.forcePull();
      await this.flushQueue();
    });

    socket.on('disconnect', () => {
      connected = false;
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.log('🔌 Socket connection error:', error.message);
    });

    // server push (เช่นอุปกรณ์อื่นแก้ไข)
    socket.on('user:data:updated', async (serverData) => {
      console.log('📡 Received server update:', serverData);
      const local = await this.getLocal();
      const merged = this._resolveConflict(local, {
        ...serverData,
        updatedAt: serverData.updatedAt || nowIso(),
      });
      await AsyncStorage.setItem(KS.LOCAL, JSON.stringify(merged));
      this._emit(merged);
    });

    // ping presence
    setInterval(() => {
      if (socket && connected) socket.emit('presence:ping', { t: Date.now() });
    }, 15000);
  },

  async _hydrateFromStorage() {
    try {
      const q = await AsyncStorage.getItem(KS.QUEUE);
      _pendingQueue = q ? JSON.parse(q) : [];
      console.log('📦 Hydrated queue from storage:', _pendingQueue.length, 'items');
    } catch {
      _pendingQueue = [];
    }
  },

  _emit(data) {
    _subscribers.forEach((cb) => {
      try { cb(data); } catch {}
    });
  },

  _resolveConflict(local, incoming) {
    // last-write-wins by updatedAt
    const lt = Date.parse(local?.updatedAt || 0);
    const it = Date.parse(incoming?.updatedAt || 0);
    return it >= lt ? { ...local, ...incoming } : local;
  },

  _queue(job) {
    const item = { ...job, ts: Date.now() };
    _pendingQueue.push(item);
    AsyncStorage.setItem(KS.QUEUE, JSON.stringify(_pendingQueue)).catch(() => {});
    console.log('📝 Queued update:', job.type, _pendingQueue.length, 'total items');
  },

  _debouncedPush() {
    // throttle window – อย่าพุชถี่เกินไป
    const since = Date.now() - _lastPushedAt;
    if (since < _throttleWindow) {
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => this._pushLoop(), _throttleWindow - since);
      return;
    }
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => this._pushLoop(), 180); // debounce เล็กน้อย
  },

  async _pushLoop() {
    if (!_netOnline) return;
    if (!_pendingQueue.length) return;

    console.log('🚀 Starting push loop with', _pendingQueue.length, 'items');

    // ถ้า socket ยังไม่ connect ใช้ REST แล้วค่อยลอง socket อีกที
    let backoff = 400;
    while (_pendingQueue.length && _netOnline) {
      const job = _pendingQueue[0];
      try {
        // REST fallback (เชื่อถือได้ใน RN)
        const token = (await AsyncStorage.getItem(KS.TOKEN)) || '';
        await axios.post(`${API_BASE}/api/user/stats`, {
          stats: job.payload,
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });

        _pendingQueue.shift();
        await AsyncStorage.setItem(KS.QUEUE, JSON.stringify(_pendingQueue));
        _lastPushedAt = Date.now();
        backoff = 400; // reset
        console.log('✅ Successfully pushed update,', _pendingQueue.length, 'remaining');
      } catch (err) {
        // ถ้า error 4xx ให้ทิ้งงาน / ถ้า 5xx หรือ network ให้ retry
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500) {
          // bad payload → drop
          _pendingQueue.shift();
          await AsyncStorage.setItem(KS.QUEUE, JSON.stringify(_pendingQueue));
          console.log('❌ Dropped bad payload (4xx error)');
        } else {
          // retry with backoff
          console.log('🔄 Retrying in', backoff, 'ms due to error:', err?.message);
          await sleep(backoff);
          backoff = Math.min(backoff * 2, 6000);
        }
      }
    }
  },
};

export default UserDataSync;
