import apiClient from './apiClient';

const normalizeLessonResponse = (payload) => {
  if (!payload) {
    return {
      success: false,
      data: [],
      lessons: [],
      message: 'No data received'
    };
  }

  const lessons = payload.lessons || payload.data || [];
  return {
    success: payload.success !== false,
    data: lessons,
    lessons,
    message: payload.message
  };
};

const lessonService = {
  async getLessonsByLevel(level) {
    try {
      const { data } = await apiClient.get(`/lessons/level/${encodeURIComponent(level)}`);
      return normalizeLessonResponse(data);
    } catch (error) {
      console.error('Error fetching lessons by level:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message,
        data: [],
        lessons: []
      };
    }
  },

  async getAllLessons() {
    try {
      const { data } = await apiClient.get('/lessons');
      return normalizeLessonResponse(data);
    } catch (error) {
      console.error('Error fetching all lessons:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message,
        data: [],
        lessons: []
      };
    }
  },

  async getLessonById(lessonId) {
    try {
      const { data } = await apiClient.get(`/lessons/${encodeURIComponent(lessonId)}`);
      return {
        success: data?.success !== false,
        data: data?.data || null,
        message: data?.message
      };
    } catch (error) {
      console.error('Error fetching lesson by ID:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message,
        data: null
      };
    }
  },

  async updateLessonProgress(lessonId, progress, extra = {}) {
    try {
      const payload = {
        progress,
        ...extra
      };

      const { data } = await apiClient.put(
        `/lessons/${encodeURIComponent(lessonId)}/progress`,
        payload
      );

      return {
        success: data?.success !== false,
        data: data?.data || null,
        message: data?.message
      };
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message
      };
    }
  }
};

export default lessonService;
