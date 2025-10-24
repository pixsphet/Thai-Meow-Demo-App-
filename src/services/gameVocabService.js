import apiClient from './apiClient';

export const GAME_CATEGORIES = [
  'Animals',
  'Food',
  'People & Family',
  'Colors',
  'Time',
  'Places',
  'Transportation',
  'Weather',
  'Objects',
  'Greetings & Common Phrases',
  'Activities',
  'Emotions',
  'Technology',
  'Level Advanced',
];

export async function listCategories() {
  try {
    const res = await apiClient.get('/game-vocab/categories');
    if (res?.data?.success && Array.isArray(res.data.categories)) return res.data.categories;
    return GAME_CATEGORIES;
  } catch (_) {
    return GAME_CATEGORIES;
  }
}

export async function getByCategory(category, { count } = {}) {
  const encoded = encodeURIComponent(category);
  const endpoint = count ? `/game-vocab/${encoded}/random?count=${count}` : `/game-vocab/${encoded}`;
  const res = await apiClient.get(endpoint);
  const payload = Array.isArray(res.data?.data) ? res.data.data : res.data;
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => ({ thai: item.thai, category: item.category, imageKey: item.imageKey || '' }));
}

export default { listCategories, getByCategory, GAME_CATEGORIES };


