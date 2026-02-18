import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else if (isSignUp) {
      setMessage('Tjek din email for bekræftelseslink!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧶</div>
          <h1 className="text-3xl font-bold text-nordic-800">StrikkeApp</h1>
          <p className="text-nordic-500 mt-1">Hold styr på dine strikkeprojekter</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-nordic-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-warm-200
                         focus:outline-none focus:ring-2 focus:ring-warm-400 text-lg"
              placeholder="din@email.dk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-nordic-700 mb-1">Adgangskode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-warm-200
                         focus:outline-none focus:ring-2 focus:ring-warm-400 text-lg"
              placeholder="Min. 6 tegn"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.includes('Tjek') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                       text-white font-semibold text-lg transition-colors
                       disabled:opacity-50"
          >
            {loading ? 'Vent...' : isSignUp ? 'Opret konto' : 'Log ind'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-nordic-500 hover:text-nordic-700"
          >
            {isSignUp ? 'Har allerede en konto? Log ind' : 'Ny bruger? Opret konto'}
          </button>
        </form>
      </div>
    </div>
  )
}
