import { simpleApiService } from './simpleApiService';

const lessonService = {
  // ดึงบทเรียนตามระดับ
  async getLessonsByLevel(level) {
    try {
      console.log(`Fetching lessons for level: ${level}`);
      
      // ใช้ simpleApiService เพื่อเรียก API
      const response = await simpleApiService.makeRequest(`/lessons/level/${level}`, {
        method: 'GET',
      });

      if (response.success) {
        console.log('Lessons fetched successfully:', response.data);
        return {
          success: true,
          data: response.data,
          lessons: response.data, // สำหรับ backward compatibility
        };
      } else {
        console.error('Failed to fetch lessons:', response.error);
        return {
          success: false,
          message: response.error || 'Failed to fetch lessons',
          data: [],
          lessons: [],
        };
      }
    } catch (error) {
      console.error('Error in getLessonsByLevel:', error);
      return {
        success: false,
        message: error.message || 'Network error',
        data: [],
        lessons: [],
      };
    }
  },

  // ดึงบทเรียนทั้งหมด
  async getAllLessons() {
    try {
      console.log('Fetching all lessons');
      
      const response = await simpleApiService.makeRequest('/lessons', {
        method: 'GET',
      });

      if (response.success) {
        console.log('All lessons fetched successfully:', response.data);
        return {
          success: true,
          data: response.data,
          lessons: response.data,
        };
      } else {
        console.error('Failed to fetch all lessons:', response.error);
        return {
          success: false,
          message: response.error || 'Failed to fetch lessons',
          data: [],
          lessons: [],
        };
      }
    } catch (error) {
      console.error('Error in getAllLessons:', error);
      return {
        success: false,
        message: error.message || 'Network error',
        data: [],
        lessons: [],
      };
    }
  },

  // ดึงบทเรียนตาม ID
  async getLessonById(lessonId) {
    try {
      console.log(`Fetching lesson by ID: ${lessonId}`);
      
      const response = await simpleApiService.makeRequest(`/lessons/${lessonId}`, {
        method: 'GET',
      });

      if (response.success) {
        console.log('Lesson fetched successfully:', response.data);
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error('Failed to fetch lesson:', response.error);
        return {
          success: false,
          message: response.error || 'Failed to fetch lesson',
          data: null,
        };
      }
    } catch (error) {
      console.error('Error in getLessonById:', error);
      return {
        success: false,
        message: error.message || 'Network error',
        data: null,
      };
    }
  },

  // อัปเดตความคืบหน้าบทเรียน
  async updateLessonProgress(lessonId, progress) {
    try {
      console.log(`Updating lesson progress for ID: ${lessonId}, progress: ${progress}`);
      
      const response = await simpleApiService.makeRequest(`/lessons/${lessonId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ progress }),
      });

      if (response.success) {
        console.log('Lesson progress updated successfully:', response.data);
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.error('Failed to update lesson progress:', response.error);
        return {
          success: false,
          message: response.error || 'Failed to update progress',
        };
      }
    } catch (error) {
      console.error('Error in updateLessonProgress:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  },
};

export default lessonService;
