import React from 'react';
import NewLessonGame from './NewLessonGame';

const ThaiVowelGame = ({ navigation, route }) => {
  const routeName = route?.name || 'BeginnerVowelsStage';
  const baseParams = {
    lessonId: 2,
    category: 'vowels_basic',
    level: route?.params?.level || 'Beginner',
    stageTitle: route?.params?.stageTitle || 'สระ 32 ตัว',
    generator: route?.params?.generator || 'lesson2_vowels',
    stageSelectRoute: route?.params?.stageSelectRoute || 'LevelStage1',
    replayRoute: route?.params?.replayRoute || routeName,
    // Default next stage to GreetingStage3 if not provided, to match stage flow like ConsonantStage1
    nextStageMeta: route?.params?.nextStageMeta || {
      route: 'GreetingStage3Game',
      params: {
        lessonId: 3,
        category: 'thai-greetings',
        level: route?.params?.level || 1,
        stageTitle: 'คำทักทาย',
      },
    },
    ...route?.params,
  };

  const mergedRoute = {
    ...route,
    params: baseParams,
  };

  return <NewLessonGame navigation={navigation} route={mergedRoute} />;
};

export default ThaiVowelGame;
