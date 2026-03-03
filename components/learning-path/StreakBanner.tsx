'use client'

export default function StreakBanner({ streak, bothDone }: { streak: number; bothDone: boolean }) {
  if (streak === 0 && !bothDone) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="font-semibold text-gray-700 text-sm">Start your streak!</div>
          <div className="text-xs text-gray-400">Complete both sessions today to begin a streak.</div>
        </div>
      </div>
    )
  }

  const streakColors =
    streak >= 30 ? 'from-purple-500 to-pink-500' :
    streak >= 14 ? 'from-orange-500 to-red-500' :
    streak >= 7  ? 'from-yellow-500 to-orange-500' :
                   'from-blue-500 to-blue-600'

  const message =
    streak >= 30 ? 'Legendary streak! 🏆' :
    streak >= 14 ? 'On fire! Keep going! 🔥' :
    streak >= 7  ? 'One week strong! 💪' :
    streak >= 3  ? 'Great consistency!' :
                   'Good start!'

  return (
    <div className={`bg-gradient-to-r ${streakColors} rounded-xl px-5 py-4 flex items-center justify-between text-white`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔥</span>
        <div>
          <div className="font-bold text-lg">{streak}-Day Streak</div>
          <div className="text-sm text-white/80">{message}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{streak}</div>
        <div className="text-xs text-white/70">days in a row</div>
      </div>
    </div>
  )
}
