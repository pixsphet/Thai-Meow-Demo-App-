import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import progressService from '../services/progressService';

interface Player {
  userId: string;
  displayName?: string;
  photoUrl?: string;
  levelInfo: {
    level: number;
    xp: number;
    nextLevelXp: number;
  };
  streak: {
    current: number;
    best: number;
    lastLoginDate?: string;
  };
  wallet: {
    diamonds: number;
    hearts: number;
    maxHearts: number;
  };
  totals: {
    lessonsCompleted: number;
    correctAnswers: number;
    wrongAnswers: number;
  };
}

interface PlayerContextType {
  player: Player | null;
  loading: boolean;
  updatePlayer: (player: Player) => void;
  refreshPlayer: () => Promise<void>;
  updateStreak: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
  userId: string;
}

export function PlayerProvider({ children, userId }: PlayerProviderProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const updatePlayer = (newPlayer: Player) => {
    setPlayer(newPlayer);
  };

  const refreshPlayer = async () => {
    try {
      setLoading(true);
      const playerData = await progressService.getPlayer(userId);
      setPlayer(playerData);
    } catch (error) {
      console.error('Error refreshing player:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    try {
      await progressService.updateStreakToday(userId);
      await refreshPlayer();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  useEffect(() => {
    refreshPlayer();
  }, [userId]);

  return (
    <PlayerContext.Provider value={{
      player,
      loading,
      updatePlayer,
      refreshPlayer,
      updateStreak
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
