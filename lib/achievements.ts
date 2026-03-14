export interface AchievementDef {
  key: string
  category: 'first_steps' | 'consistency' | 'volume' | 'level' | 'excellence'
  icon: string
  threshold: number
  skill?: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // First steps
  { key: 'first_writing', category: 'first_steps', icon: '✍️', threshold: 1 },
  { key: 'first_speaking', category: 'first_steps', icon: '🎙️', threshold: 1 },
  { key: 'first_listening', category: 'first_steps', icon: '🎧', threshold: 1 },
  { key: 'first_grammar', category: 'first_steps', icon: '📝', threshold: 1 },
  { key: 'first_vocab', category: 'first_steps', icon: '🧠', threshold: 1 },

  // Consistency
  { key: 'streak_7', category: 'consistency', icon: '🔥', threshold: 7 },
  { key: 'streak_30', category: 'consistency', icon: '⭐', threshold: 30 },
  { key: 'streak_100', category: 'consistency', icon: '🏆', threshold: 100 },

  // Volume - Writing
  { key: 'writing_10', category: 'volume', icon: '✍️', threshold: 10, skill: 'writing' },
  { key: 'writing_25', category: 'volume', icon: '✍️', threshold: 25, skill: 'writing' },
  { key: 'writing_50', category: 'volume', icon: '✍️', threshold: 50, skill: 'writing' },
  { key: 'writing_100', category: 'volume', icon: '✍️', threshold: 100, skill: 'writing' },

  // Volume - Speaking
  { key: 'speaking_10', category: 'volume', icon: '🎙️', threshold: 10, skill: 'speaking' },
  { key: 'speaking_25', category: 'volume', icon: '🎙️', threshold: 25, skill: 'speaking' },
  { key: 'speaking_50', category: 'volume', icon: '🎙️', threshold: 50, skill: 'speaking' },
  { key: 'speaking_100', category: 'volume', icon: '🎙️', threshold: 100, skill: 'speaking' },

  // Volume - Listening
  { key: 'listening_10', category: 'volume', icon: '🎧', threshold: 10, skill: 'listening' },
  { key: 'listening_25', category: 'volume', icon: '🎧', threshold: 25, skill: 'listening' },
  { key: 'listening_50', category: 'volume', icon: '🎧', threshold: 50, skill: 'listening' },
  { key: 'listening_100', category: 'volume', icon: '🎧', threshold: 100, skill: 'listening' },

  // Volume - Grammar
  { key: 'grammar_10', category: 'volume', icon: '📝', threshold: 10, skill: 'grammar' },
  { key: 'grammar_25', category: 'volume', icon: '📝', threshold: 25, skill: 'grammar' },
  { key: 'grammar_50', category: 'volume', icon: '📝', threshold: 50, skill: 'grammar' },
  { key: 'grammar_100', category: 'volume', icon: '📝', threshold: 100, skill: 'grammar' },

  // Volume - Vocabulary
  { key: 'vocab_10', category: 'volume', icon: '🧠', threshold: 10, skill: 'vocab' },
  { key: 'vocab_25', category: 'volume', icon: '🧠', threshold: 25, skill: 'vocab' },
  { key: 'vocab_50', category: 'volume', icon: '🧠', threshold: 50, skill: 'vocab' },
  { key: 'vocab_100', category: 'volume', icon: '🧠', threshold: 100, skill: 'vocab' },

  // Level up
  { key: 'level_b1', category: 'level', icon: '📈', threshold: 1 },
  { key: 'level_b2', category: 'level', icon: '📈', threshold: 1 },
  { key: 'level_c1', category: 'level', icon: '🚀', threshold: 1 },
  { key: 'level_c2', category: 'level', icon: '👑', threshold: 1 },

  // Excellence
  { key: 'writing_band8', category: 'excellence', icon: '🏅', threshold: 1 },
  { key: 'speaking_9', category: 'excellence', icon: '🎖️', threshold: 1 },
  { key: 'listening_perfect', category: 'excellence', icon: '💯', threshold: 1 },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.key, a]))
