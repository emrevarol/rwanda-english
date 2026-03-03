import Navigation from '@/components/shared/Navigation'
import { Link } from '@/i18n/navigation'

export default function SpeakingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
          <div className="text-7xl mb-6">🎙️</div>
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Coming Soon
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Speaking Practice</h1>
          <p className="text-gray-500 text-lg mb-2 max-w-md mx-auto">
            We're building an advanced speaking practice module with real-time voice analysis.
          </p>
          <p className="text-gray-400 text-sm mb-10">
            In the meantime, practice your speaking by discussing today's topics with the AI Tutor.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-left max-w-sm mx-auto">
            <div className="text-sm font-semibold text-blue-700 mb-3">What's coming:</div>
            <ul className="space-y-2 text-sm text-blue-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Real-time pronunciation feedback
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Fluency & intonation scoring
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Model answers with native audio
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> IELTS Speaking Band scoring
              </li>
            </ul>
          </div>

          <Link
            href="/tutor"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            🤖 Practice with AI Tutor instead
          </Link>
        </div>
      </div>
    </div>
  )
}
