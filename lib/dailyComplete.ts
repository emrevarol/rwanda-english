// Auto-mark a daily plan task as done after completing an activity
export async function markDailyTaskDone(taskType: string, minutes?: number) {
  try {
    const res = await fetch('/api/learning-path/today')
    if (!res.ok) return
    const data = await res.json()
    const plan = data.plan
    const progress = data.progress

    if (plan.task1.type === taskType && !progress.task1Done) {
      await fetch('/api/learning-path/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'task1', minutes: minutes || 0 }),
      })
    } else if (plan.task2.type === taskType && !progress.task2Done) {
      await fetch('/api/learning-path/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'task2', minutes: minutes || 0 }),
      })
    }
  } catch {}
}
