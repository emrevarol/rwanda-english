'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
                <span>🇷🇼</span>
                <span>Designed for Rwandan Teachers</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Master English in{' '}
                <span className="text-yellow-300">365 Days</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-lg">
                AI-powered English learning platform for Rwandan teachers. Just 2 sessions of 15 minutes a day — your personalized path to fluency.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="bg-yellow-400 text-blue-900 text-base font-bold px-7 py-3.5 rounded-xl hover:bg-yellow-300 transition-all shadow-lg"
                >
                  Start Free Today →
                </Link>
                <Link
                  href="/login"
                  className="bg-white/10 border border-white/30 text-white text-base font-medium px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all"
                >
                  Login
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">365</span>
                  <span>Day Program</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">30</span>
                  <span>min/day</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">A1→C2</span>
                  <span>CEFR</span>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 h-80">
                <img
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=800&q=80"
                  alt="Teachers learning English"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
              </div>
              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">🔥</div>
                <div>
                  <div className="text-xs text-gray-400">Current streak</div>
                  <div className="text-lg font-bold text-gray-800">21 days</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📈</div>
                <div>
                  <div className="text-xs text-gray-400">Level up</div>
                  <div className="text-lg font-bold text-gray-800">A2 → B1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              No decision fatigue. We plan everything. You just show up.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard step="01" icon="📝" title="Take Placement Test" description="A 10-question adaptive test determines your CEFR level (A1–C2) and personalizes your entire 365-day journey." color="blue" />
            <StepCard step="02" icon="🗓" title="Follow Daily Plan" description="Every day you get 2 sessions of 15 minutes. Writing, Listening, or AI Tutor — we decide, you execute." color="green" />
            <StepCard step="03" icon="📊" title="Track Your Progress" description="See your CEFR level rise, skills radar evolve, and streak grow. Your dashboard shows every improvement." color="purple" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="text-gray-500 mt-3">Four core modules, powered by Claude AI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureBig
              icon="✍️"
              title="Writing Practice"
              description="IELTS-style essay and data description tasks. Get band scores, detailed feedback on grammar and vocabulary, and improved sentence examples — all from AI."
              image="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80"
              color="blue"
              href="/register"
            />
            <FeatureBig
              icon="🎧"
              title="Listening Practice"
              description="AI generates Rwanda-relevant passages read aloud via text-to-speech. Answer comprehension questions and get instant explanations."
              image="https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80"
              color="purple"
              href="/register"
            />
            <FeatureBig
              icon="🤖"
              title="AI Tutor Chat"
              description="Your personal English teacher available 24/7. Ask grammar questions, practice conversations, get vocabulary help. The tutor knows your level and adapts."
              image="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=600&q=80"
              color="green"
              href="/register"
            />
            <FeatureBig
              icon="🎙️"
              title="Speaking Practice"
              description="Coming soon — real-time pronunciation feedback, fluency scoring, and IELTS Speaking band evaluation."
              image="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80"
              color="orange"
              href="/register"
              comingSoon
            />
          </div>
        </div>
      </section>

      {/* CEFR levels */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Adaptive to Your Level</h2>
          <p className="text-gray-500 mb-10">Our AI adapts every exercise to your current CEFR level</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { level: 'A1', label: 'Beginner', color: 'bg-red-100 text-red-700 border-red-200' },
              { level: 'A2', label: 'Elementary', color: 'bg-orange-100 text-orange-700 border-orange-200' },
              { level: 'B1', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
              { level: 'B2', label: 'Upper Inter.', color: 'bg-green-100 text-green-700 border-green-200' },
              { level: 'C1', label: 'Advanced', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { level: 'C2', label: 'Mastery', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            ].map((l) => (
              <div key={l.level} className={`rounded-xl border-2 p-4 ${l.color}`}>
                <div className="text-2xl font-extrabold">{l.level}</div>
                <div className="text-xs mt-1 font-medium">{l.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🇷🇼</div>
          <h2 className="text-3xl font-bold mb-4">Join Rwanda's English Revolution</h2>
          <p className="text-blue-100 mb-8 text-lg">
            15 minutes a day, twice a day. That's all it takes.
          </p>
          <Link
            href="/register"
            className="inline-block bg-yellow-400 text-blue-900 text-lg font-bold px-10 py-4 rounded-xl hover:bg-yellow-300 transition-all shadow-lg"
          >
            Start Your 365-Day Journey →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2024 Rwanda English Proficiency Platform · Powered by Claude AI · Built for Rwandan Teachers</p>
      </footer>
    </div>
  )
}

function StepCard({ step, icon, title, description, color }: {
  step: string; icon: string; title: string; description: string; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600'
  }
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-gray-300 mb-4 tracking-widest">{step}</div>
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center text-2xl mb-4`}>{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function FeatureBig({ icon, title, description, image, color, href, comingSoon }: {
  icon: string; title: string; description: string; image: string
  color: string; href: string; comingSoon?: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-purple-500 to-purple-700',
    green: 'from-green-500 to-green-700',
    orange: 'from-orange-500 to-orange-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`relative h-40 bg-gradient-to-br ${colors[color]} overflow-hidden`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover mix-blend-overlay opacity-40"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">{icon}</span>
        </div>
        {comingSoon && (
          <div className="absolute top-3 right-3 bg-white/90 text-orange-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
            Coming Soon
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
