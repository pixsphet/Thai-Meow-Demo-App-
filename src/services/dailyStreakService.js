import AsyncStorage from '@react-native-async-storage/async-storage';

class DailyStreakService {
    constructor() {
        this.userId = 'guest';
    }

    setUser(userId) {
        this.userId = userId || 'guest';
    }

    getKey(key) {
        return `${key}:${this.userId}`;
    }

    // ตรวจสอบและอัปเดตไฟสะสม
    async updateStreak() {
        try {
            const today = this.getTodayString();
            const lastPlayDate = await this.getLastPlayDate();
            const currentStreak = await this.getCurrentStreak();

            console.log('🔥 Streak check:', {
                today,
                lastPlayDate,
                currentStreak
            });

            // ถ้าเป็นวันแรกที่เล่น
            if (!lastPlayDate) {
                await this.setStreak(1);
                await this.setLastPlayDate(today);
                console.log('🔥 First day streak started');
                return { streak: 1, isNewStreak: true };
            }

            // ถ้าเล่นวันเดียวกัน ไม่ต้องเพิ่มไฟ
            if (lastPlayDate === today) {
                console.log('🔥 Same day - no streak change');
                return { streak: currentStreak, isNewStreak: false };
            }

            // ตรวจสอบว่าเล่นติดต่อกันหรือไม่
            const yesterday = this.getYesterdayString();
            const isConsecutive = lastPlayDate === yesterday;

            if (isConsecutive) {
                // เล่นติดต่อกัน - เพิ่มไฟ
                const newStreak = currentStreak + 1;
                await this.setStreak(newStreak);
                await this.setLastPlayDate(today);
                console.log('🔥 Consecutive day - streak increased to:', newStreak);
                return { streak: newStreak, isNewStreak: true };
            } else {
                // ไม่เล่นติดต่อกัน - รีเซ็ตไฟ
                await this.setStreak(1);
                await this.setLastPlayDate(today);
                console.log('🔥 Non-consecutive day - streak reset to 1');
                return { streak: 1, isNewStreak: true };
            }
        } catch (error) {
            console.error('❌ Error updating streak:', error);
            return { streak: 0, isNewStreak: false };
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

    // ดึงไฟสะสมปัจจุบัน
    async getCurrentStreak() {
        try {
            const streak = await AsyncStorage.getItem(this.getKey('dailyStreak'));
            return streak ? parseInt(streak) : 0;
        } catch (error) {
            console.error('❌ Error getting current streak:', error);
            return 0;
        }
    }

    // ตั้งค่าไฟสะสม
    async setStreak(streak) {
        try {
            await AsyncStorage.setItem(this.getKey('dailyStreak'), streak.toString());
        } catch (error) {
            console.error('❌ Error setting streak:', error);
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
            const streak = await this.getCurrentStreak();
            const lastPlayDate = await this.getLastPlayDate();
            const today = this.getTodayString();
            
            return {
                currentStreak: streak,
                lastPlayDate,
                today,
                isPlayedToday: lastPlayDate === today,
                daysSinceLastPlay: this.getDaysDifference(lastPlayDate, today)
            };
        } catch (error) {
            console.error('❌ Error getting streak data:', error);
            return {
                currentStreak: 0,
                lastPlayDate: null,
                today: this.getTodayString(),
                isPlayedToday: false,
                daysSinceLastPlay: 0
            };
        }
    }

    // รีเซ็ตไฟสะสม
    async resetStreak() {
        try {
            await AsyncStorage.removeItem(this.getKey('dailyStreak'));
            await AsyncStorage.removeItem(this.getKey('lastPlayDate'));
            console.log('🔥 Streak reset');
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
}

export default new DailyStreakService();
