const express = require('express');
const router = express.Router();

// Mock lessons data
const mockLessons = [
  {
    _id: '1',
    lesson_id: 1,
    title: 'พยัญชนะ ก-จ',
    titleTH: 'พยัญชนะ ก-จ',
    level: 'Beginner',
    key: 'consonants-1',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวแรก',
    order: 1,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: true,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    lesson_id: 2,
    title: 'พยัญชนะ ฉ-ญ',
    titleTH: 'พยัญชนะ ฉ-ญ',
    level: 'Beginner',
    key: 'consonants-2',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวถัดไป',
    order: 2,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    lesson_id: 3,
    title: 'พยัญชนะ ฎ-ณ',
    titleTH: 'พยัญชนะ ฎ-ณ',
    level: 'Beginner',
    key: 'consonants-3',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวถัดไป',
    order: 3,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '4',
    lesson_id: 4,
    title: 'พยัญชนะ ด-บ',
    titleTH: 'พยัญชนะ ด-บ',
    level: 'Beginner',
    key: 'consonants-4',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวถัดไป',
    order: 4,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '5',
    lesson_id: 5,
    title: 'พยัญชนะ ป-ย',
    titleTH: 'พยัญชนะ ป-ย',
    level: 'Beginner',
    key: 'consonants-5',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวถัดไป',
    order: 5,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '6',
    lesson_id: 6,
    title: 'พยัญชนะ ร-อ',
    titleTH: 'พยัญชนะ ร-อ',
    level: 'Beginner',
    key: 'consonants-6',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 5 ตัวถัดไป',
    order: 6,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '7',
    lesson_id: 7,
    title: 'พยัญชนะ ฮ',
    titleTH: 'พยัญชนะ ฮ',
    level: 'Beginner',
    key: 'consonants-7',
    description: 'เรียนรู้พยัญชนะตัวสุดท้าย',
    order: 7,
    difficulty: 'easy',
    estimatedTime: 10,
    xpReward: 50,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '8',
    lesson_id: 8,
    title: 'ทบทวนพยัญชนะทั้งหมด',
    titleTH: 'ทบทวนพยัญชนะทั้งหมด',
    level: 'Beginner',
    key: 'consonants-review',
    description: 'ทบทวนพยัญชนะทั้งหมดที่เรียนมา',
    order: 8,
    difficulty: 'medium',
    estimatedTime: 15,
    xpReward: 100,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '9',
    lesson_id: 9,
    title: 'การออกเสียงพยัญชนะ',
    titleTH: 'การออกเสียงพยัญชนะ',
    level: 'Beginner',
    key: 'pronunciation',
    description: 'เรียนรู้การออกเสียงพยัญชนะที่ถูกต้อง',
    order: 9,
    difficulty: 'medium',
    estimatedTime: 15,
    xpReward: 100,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '10',
    lesson_id: 10,
    title: 'แบบทดสอบพยัญชนะ',
    titleTH: 'แบบทดสอบพยัญชนะ',
    level: 'Beginner',
    key: 'consonants-test',
    description: 'ทดสอบความรู้พยัญชนะทั้งหมด',
    order: 10,
    difficulty: 'hard',
    estimatedTime: 20,
    xpReward: 200,
    isUnlocked: false,
    isCompleted: false,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// GET /api/lessons/level/:level - ดึงบทเรียนตามระดับ
router.get('/level/:level', (req, res) => {
  try {
    const { level } = req.params;
    console.log(`📚 Fetching lessons for level: ${level}`);
    
    const lessons = mockLessons.filter(lesson => lesson.level === level);
    
    res.json({
      success: true,
      data: lessons,
      lessons: lessons, // สำหรับ backward compatibility
      count: lessons.length,
      level: level
    });
  } catch (error) {
    console.error('Error fetching lessons by level:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: [],
      lessons: []
    });
  }
});

// GET /api/lessons - ดึงบทเรียนทั้งหมด
router.get('/', (req, res) => {
  try {
    console.log('📚 Fetching all lessons');
    
    res.json({
      success: true,
      data: mockLessons,
      lessons: mockLessons, // สำหรับ backward compatibility
      count: mockLessons.length
    });
  } catch (error) {
    console.error('Error fetching all lessons:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: [],
      lessons: []
    });
  }
});

// GET /api/lessons/:id - ดึงบทเรียนตาม ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📚 Fetching lesson by ID: ${id}`);
    
    const lesson = mockLessons.find(l => l._id === id || l.lesson_id === parseInt(id));
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบบทเรียนที่ต้องการ',
        data: null
      });
    }
    
    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Error fetching lesson by ID:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: null
    });
  }
});

// PUT /api/lessons/:id/progress - อัปเดตความคืบหน้าบทเรียน
router.put('/:id/progress', (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    console.log(`📚 Updating lesson progress for ID: ${id}, progress: ${progress}`);
    
    const lessonIndex = mockLessons.findIndex(l => l._id === id || l.lesson_id === parseInt(id));
    
    if (lessonIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบบทเรียนที่ต้องการ'
      });
    }
    
    // อัปเดตความคืบหน้า
    mockLessons[lessonIndex].progress = progress;
    mockLessons[lessonIndex].updatedAt = new Date();
    
    // ถ้าความคืบหน้าเป็น 100% ให้ทำเครื่องหมายว่าเสร็จแล้ว
    if (progress >= 100) {
      mockLessons[lessonIndex].isCompleted = true;
      // ปลดล็อกบทเรียนถัดไป
      if (lessonIndex + 1 < mockLessons.length) {
        mockLessons[lessonIndex + 1].isUnlocked = true;
      }
    }
    
    res.json({
      success: true,
      data: mockLessons[lessonIndex],
      message: 'อัปเดตความคืบหน้าสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถอัปเดตความคืบหน้าได้'
    });
  }
});

module.exports = router;
