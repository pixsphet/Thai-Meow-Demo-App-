import React, { useMemo } from 'react';
import NewLessonGame from './NewLessonGame';

const ThaiVowelGame = ({ navigation, route }) => {
  const mergedRoute = useMemo(() => {
    const params = route?.params || {};

    return {
      ...route,
      params: {
        ...params,
        lessonId: params.lessonId ?? 2,
        category: params.category ?? 'vowels_basic',
        level: params.level ?? 'Beginner',
        stageTitle: params.stageTitle ?? 'สระ 32 ตัว',
        generator: 'lesson2_vowels',
      },
    };
  }, [route]);

  return <NewLessonGame navigation={navigation} route={mergedRoute} />;
};

export default ThaiVowelGame;
