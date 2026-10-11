export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  /** Wins by guess count (index 0 = 1 guess), last slot = losses. */
  distribution: number[];
  lastPlayed: number;
  lastWon: number;
}

export const MAX_GUESSES = 6;

export const emptyStats = (): Stats => ({
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: Array(MAX_GUESSES + 1).fill(0),
  lastPlayed: 0,
  lastWon: 0,
});

/** Adds a finished game. Recording the same puzzle twice is a no-op. */
export function recordGame(stats: Stats, puzzle: number, won: boolean, guesses: number): Stats {
  if (stats.lastPlayed >= puzzle) return stats;
  const distribution = [...stats.distribution];
  while (distribution.length < MAX_GUESSES + 1) distribution.push(0);
  distribution[won ? guesses - 1 : MAX_GUESSES]++;
  const currentStreak = won ? (stats.lastWon === puzzle - 1 ? stats.currentStreak + 1 : 1) : 0;
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastPlayed: puzzle,
    lastWon: won ? puzzle : stats.lastWon,
  };
}

/** The streak still counts while yesterday was a win, so it doesn't show 0 before today's game. */
export function visibleStreak(stats: Stats, today: number): number {
  return stats.lastWon >= today - 1 ? stats.currentStreak : 0;
}
