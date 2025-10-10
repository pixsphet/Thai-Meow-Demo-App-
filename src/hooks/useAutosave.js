import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import progressService from '../services/progressService';

type Opts = {
  userId: string;
  lessonId: string;
  makePayload: () => any; // คืน payload ปัจจุบัน (currentIndex, score, hearts, xp, perLetter, answers, questionsSnapshot, category, total)
};

export function useAutosave({ userId, lessonId, makePayload }: Opts) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (appState.current.match(/active/) && next.match(/inactive|background/)) {
        const payload = { ...makePayload(), userId, lessonId };
        try {
          await progressService.saveServer(payload);
          await progressService.saveLocal(userId, lessonId, payload);
          console.log('💾 Autosave on background');
        } catch (e) { console.log('Autosave bg error', e?.message); }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [userId, lessonId, makePayload]);
}
