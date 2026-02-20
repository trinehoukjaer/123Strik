import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const { dark, toggle } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSignUpSuccess(false)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://123strik.vercel.app',
        },
      })
      if (error) {
        setMessage(error.message)
      } else {
        setSignUpSuccess(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-warm-50 dark:bg-night-900 px-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl
                   text-nordic-500 hover:bg-warm-100 dark:text-nordic-300 dark:hover:bg-night-600
                   transition-colors"
        aria-label={dark ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.005 9.005 0 0012 21a9.005 9.005 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧶</div>
          <h1 className="text-3xl font-bold text-nordic-800 dark:text-nordic-100">123Strik</h1>
          <p className="text-nordic-500 dark:text-nordic-400 mt-1">Hold styr på dine strikkeprojekter</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg"
              placeholder="din@email.dk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Adgangskode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg"
              placeholder="Min. 6 tegn"
            />
          </div>

          {message && (
            <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
          )}

          {signUpSuccess ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center space-y-2">
              <p className="text-green-700 dark:text-green-400 font-semibold">
                Tjek din e-mail for at bekræfte din konto
              </p>
              <p className="text-green-600 dark:text-green-500 text-sm">
                Vi har sendt et link til <strong>{email}</strong>. Klik på linket for at aktivere din konto og logge ind.
              </p>
              <button
                type="button"
                onClick={() => { setSignUpSuccess(false); setIsSignUp(false) }}
                className="mt-2 text-sm text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200"
              >
                Gå til log ind
              </button>
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                           dark:bg-nordic-600 dark:hover:bg-nordic-500
                           text-white font-semibold text-lg transition-colors
                           disabled:opacity-50"
              >
                {loading ? 'Vent...' : isSignUp ? 'Opret konto' : 'Log ind'}
              </button>

              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setSignUpSuccess(false) }}
                className="w-full text-sm text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200"
              >
                {isSignUp ? 'Har allerede en konto? Log ind' : 'Ny bruger? Opret konto'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
