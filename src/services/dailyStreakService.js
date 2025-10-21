import AsyncStorage from '@react-native-async-storage/async-storage';

class DailyStreakService {
    constructor() {
        this.userId = 'guest';
        this.listeners = new Set();
        this.cache = new Map(); // เพิ่ม cache เพื่อลดการเรียก AsyncStorage
        this.isInitialized = false;
    }

    setUser(userId) {
        const newUserId = userId || 'guest';
        if (this.userId !== newUserId) {
            this.userId = newUserId;
            this.cache.clear(); // ล้าง cache เมื่อเปลี่ยน user
            this.isInitialized = false;
            console.log('🔄 DailyStreakService: User changed to', newUserId);
        }
    }

    getKey(key) {
        return `${key}:${this.userId}`;
    }

    // ตรวจสอบและอัปเดตไฟสะสม (ปรับปรุงแล้ว)
    async updateStreak() {
        try {
            const today = this.getTodayString();
            const lastPlayDate = await this.getLastPlayDate();
            const currentStreak = await this.getCurrentStreak();
            let updatedLastPlayDate = lastPlayDate;
            let newStreak = currentStreak;
            let isNewStreak = false;

            // Validation
            if (!today || !this.isValidDateString(today)) {
                throw new Error('Invalid today date');
            }

            console.log('🔥 Streak check:', {
                today,
                lastPlayDate,
                currentStreak,
                userId: this.userId
            });

            // ถ้าเป็นวันแรกที่เล่น
            if (!lastPlayDate) {
                newStreak = 1;
                isNewStreak = true;
                await this.setStreak(newStreak);
                await this.setLastPlayDate(today);
                updatedLastPlayDate = today;
                console.log('🔥 First day streak started');
            } else if (lastPlayDate === today) {
                // ถ้าเล่นวันเดียวกัน ไม่ต้องเพิ่มไฟ
                console.log('🔥 Same day - no streak change');
            } else {
                // ตรวจสอบว่าเล่นติดต่อกันหรือไม่
                const yesterday = this.getYesterdayString();
                const isConsecutive = lastPlayDate === yesterday;

                if (isConsecutive) {
                    // เล่นติดต่อกัน - เพิ่มไฟ
                    newStreak = currentStreak + 1;
                    isNewStreak = true;
                    await this.setStreak(newStreak);
                    await this.setLastPlayDate(today);
                    updatedLastPlayDate = today;
                    console.log('🔥 Consecutive day - streak increased to:', newStreak);
                } else {
                    // ไม่เล่นติดต่อกัน - รีเซ็ตไฟ
                    newStreak = 1;
                    isNewStreak = true;
                    await this.setStreak(newStreak);
                    await this.setLastPlayDate(today);
                    updatedLastPlayDate = today;
                    console.log('🔥 Non-consecutive day - streak reset to 1');
                }
            }

            const maxStreak = await this.updateMaxStreak(newStreak);
            const snapshot = await this.buildSnapshot({
                streak: newStreak,
                isNewStreak,
                maxStreak,
                lastPlayDate: updatedLastPlayDate ?? today
            });
            this.notifyListeners(snapshot);

            // อัปเดต cache
            this.cache.set('currentStreak', newStreak);
            this.cache.set('lastPlayDate', updatedLastPlayDate ?? today);
            this.cache.set('maxStreak', maxStreak);

            return { streak: newStreak, isNewStreak, maxStreak };
        } catch (error) {
            console.error('❌ Error updating streak:', error);
            
            // Fallback: พยายามกู้คืนข้อมูลพื้นฐาน
            try {
                const fallbackStreak = await this.getCurrentStreak();
                return { 
                    streak: this.isValidStreak(fallbackStreak) ? fallbackStreak : 0, 
                    isNewStreak: false,
                    maxStreak: 0
                };
            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError);
                return { streak: 0, isNewStreak: false, maxStreak: 0 };
            }
        }
    }

    // เริ่มไฟสะสม (เมื่อเข้าเล่นเกม)
    async startStreak() {
        try {
            const result = await this.updateStreak();
            console.log('🔥 Streak started/updated:', result);
            return result;
        } catch (error) {
            console.error('❌ Error starting streak:', error);
            return { streak: 0, isNewStreak: false };
        }
    }

    // ดึงไฟสะสมปัจจุบัน (พร้อม cache)
    async getCurrentStreak() {
        try {
            const cacheKey = 'currentStreak';
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const streak = await AsyncStorage.getItem(this.getKey('dailyStreak'));
            const result = streak ? parseInt(streak) : 0;
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('❌ Error getting current streak:', error);
            return 0;
        }
    }

    // ตั้งค่าไฟสะสม (พร้อม cache)
    async setStreak(streak) {
        try {
            await AsyncStorage.setItem(this.getKey('dailyStreak'), streak.toString());
            this.cache.set('currentStreak', streak); // อัปเดต cache
            console.log('🔥 Streak updated:', streak);
        } catch (error) {
            console.error('❌ Error setting streak:', error);
            throw error; // throw error เพื่อให้ caller จัดการได้
        }
    }

    // ดึงวันที่เล่นครั้งล่าสุด
    async getLastPlayDate() {
        try {
            return await AsyncStorage.getItem(this.getKey('lastPlayDate'));
        } catch (error) {
            console.error('❌ Error getting last play date:', error);
            return null;
        }
    }

    // ตั้งค่าวันที่เล่นครั้งล่าสุด
    async setLastPlayDate(date) {
        try {
            await AsyncStorage.setItem(this.getKey('lastPlayDate'), date);
        } catch (error) {
            console.error('❌ Error setting last play date:', error);
        }
    }

    // ดึงข้อมูลไฟสะสมทั้งหมด
    async getStreakData() {
        try {
            const [streak, lastPlayDate, maxStreak] = await Promise.all([
                this.getCurrentStreak(),
                this.getLastPlayDate(),
                this.getMaxStreak()
            ]);
            const today = this.getTodayString();
            
            return {
                currentStreak: streak,
                lastPlayDate,
                today,
                isPlayedToday: lastPlayDate === today,
                daysSinceLastPlay: this.getDaysDifference(lastPlayDate, today),
                maxStreak
            };
        } catch (error) {
            console.error('❌ Error getting streak data:', error);
            return {
                currentStreak: 0,
                lastPlayDate: null,
                today: this.getTodayString(),
                isPlayedToday: false,
                daysSinceLastPlay: 0,
                maxStreak: 0
            };
        }
    }

    // รีเซ็ตไฟสะสม
    async resetStreak() {
        try {
            await AsyncStorage.removeItem(this.getKey('dailyStreak'));
            await AsyncStorage.removeItem(this.getKey('lastPlayDate'));
            await AsyncStorage.removeItem(this.getKey('maxStreak'));
            console.log('🔥 Streak reset');
            this.notifyListeners(await this.buildSnapshot({
                streak: 0,
                isNewStreak: false,
                maxStreak: 0,
                lastPlayDate: null
            }));
        } catch (error) {
            console.error('❌ Error resetting streak:', error);
        }
    }

    // ฟังก์ชันช่วยเหลือ
    getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    getDaysDifference(date1, date2) {
        if (!date1 || !date2) return 0;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ตรวจสอบความถูกต้องของ date string
    isValidDateString(dateString) {
        if (!dateString || typeof dateString !== 'string') return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    }

    // ตรวจสอบความถูกต้องของ streak value
    isValidStreak(streak) {
        return typeof streak === 'number' && streak >= 0 && Number.isInteger(streak);
    }

    // ตรวจสอบว่าเล่นวันนี้แล้วหรือยัง
    async hasPlayedToday() {
        try {
            const lastPlayDate = await this.getLastPlayDate();
            const today = this.getTodayString();
            return lastPlayDate === today;
        } catch (error) {
            console.error('❌ Error checking if played today:', error);
            return false;
        }
    }

    // รับรางวัลไฟสะสม
    getStreakRewards(streak) {
        const rewards = {
            xp: 0,
            diamonds: 0,
            bonus: ''
        };

        if (streak >= 1) {
            rewards.xp += 10;
            rewards.diamonds += 1;
        }
        if (streak >= 3) {
            rewards.xp += 20;
            rewards.diamonds += 2;
            rewards.bonus = '3 วันติดต่อกัน!';
        }
        if (streak >= 7) {
            rewards.xp += 50;
            rewards.diamonds += 5;
            rewards.bonus = '1 สัปดาห์ติดต่อกัน!';
        }
        if (streak >= 14) {
            rewards.xp += 100;
            rewards.diamonds += 10;
            rewards.bonus = '2 สัปดาห์ติดต่อกัน!';
        }
        if (streak >= 30) {
            rewards.xp += 200;
            rewards.diamonds += 20;
            rewards.bonus = '1 เดือนติดต่อกัน!';
        }

        return rewards;
    }

    // สมัครฟังการอัปเดตไฟสะสม
    subscribe(listener) {
        if (typeof listener !== 'function') {
            return () => {};
        }
        this.listeners.add(listener);
        // ส่งค่าปัจจุบันเมื่อสมัคร
        this.buildSnapshot().then(snapshot => {
            if (snapshot) {
                try {
                    listener(snapshot);
                } catch (error) {
                    console.error('❌ Error notifying initial streak listener:', error);
                }
            }
        }).catch(() => {});
        return () => this.listeners.delete(listener);
    }

    notifyListeners(snapshot) {
        if (!snapshot) return;
        this.listeners.forEach(listener => {
            try {
                listener(snapshot);
            } catch (error) {
                console.error('❌ Error notifying streak listener:', error);
            }
        });
    }

    async getMaxStreak() {
        try {
            const stored = await AsyncStorage.getItem(this.getKey('maxStreak'));
            const parsed = stored ? parseInt(stored, 10) : 0;
            return Number.isFinite(parsed) ? parsed : 0;
        } catch (error) {
            console.error('❌ Error getting max streak:', error);
            return 0;
        }
    }

    async setMaxStreak(streak) {
        try {
            await AsyncStorage.setItem(this.getKey('maxStreak'), streak.toString());
        } catch (error) {
            console.error('❌ Error setting max streak:', error);
        }
    }

    async updateMaxStreak(streak) {
        try {
            const currentMax = await this.getMaxStreak();
            if (!Number.isFinite(currentMax) || streak > currentMax) {
                await this.setMaxStreak(streak);
                return streak;
            }
            return currentMax;
        } catch (error) {
            console.error('❌ Error updating max streak:', error);
            return streak;
        }
    }

    async buildSnapshot(overrides = {}) {
        try {
            const [streak, lastPlayDate, maxStreak] = await Promise.all([
                overrides.streak !== undefined ? overrides.streak : this.getCurrentStreak(),
                overrides.lastPlayDate !== undefined ? overrides.lastPlayDate : this.getLastPlayDate(),
                overrides.maxStreak !== undefined ? overrides.maxStreak : this.getMaxStreak()
            ]);

            const snapshot = {
                userId: this.userId,
                streak: this.isValidStreak(streak) ? streak : 0,
                maxStreak: this.isValidStreak(maxStreak) ? maxStreak : 0,
                lastPlayDate: this.isValidDateString(lastPlayDate) ? lastPlayDate : null,
                isNewStreak: overrides.isNewStreak ?? false,
                updatedAt: new Date().toISOString(),
                cacheSize: this.cache.size,
                isHealthy: this.isServiceHealthy()
            };

            return snapshot;
        } catch (error) {
            console.error('❌ Error building streak snapshot:', error);
            return {
                userId: this.userId,
                streak: overrides.streak ?? 0,
                maxStreak: overrides.maxStreak ?? 0,
                lastPlayDate: overrides.lastPlayDate ?? null,
                isNewStreak: overrides.isNewStreak ?? false,
                updatedAt: new Date().toISOString(),
                cacheSize: this.cache.size,
                isHealthy: false,
                error: error.message
            };
        }
    }

    // ตรวจสอบสุขภาพของ service
    isServiceHealthy() {
        try {
            return this.userId && 
                   this.cache instanceof Map && 
                   this.listeners instanceof Set &&
                   typeof this.getTodayString() === 'string';
        } catch (error) {
            console.error('❌ Service health check failed:', error);
            return false;
        }
    }

    // รับข้อมูลสถิติของ service
    getServiceStats() {
        return {
            userId: this.userId,
            cacheSize: this.cache.size,
            listenersCount: this.listeners.size,
            isHealthy: this.isServiceHealthy(),
            isInitialized: this.isInitialized,
            cacheKeys: Array.from(this.cache.keys())
        };
    }
}

export default new DailyStreakService();
