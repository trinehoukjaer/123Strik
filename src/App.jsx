import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { startOfflineSync } from './lib/offlineSync'
import { ThemeProvider, useTheme } from './lib/ThemeContext'
import Auth from './components/Auth'
import ProjectList from './components/ProjectList'
import ProjectView from './components/ProjectView'
import NewProject from './components/NewProject'
import OfflineIndicator from './components/OfflineIndicator'

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl
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
  )
}

function AppContent() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'project' | 'new'
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Start offline sync
  useEffect(() => {
    const cleanup = startOfflineSync()
    return cleanup
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setView('list')
    setSelectedProject(null)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-warm-50 dark:bg-night-900">
        <div className="text-warm-400 dark:text-nordic-400 text-xl">Indlæser...</div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-night-900">
      {/* Header */}
      <header className="no-print bg-white dark:bg-night-800 border-b border-warm-100 dark:border-night-600 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧶</span>
            <h1 className="text-xl font-bold text-nordic-800 dark:text-nordic-100">StrikkeApp</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-sm text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 px-2 py-1"
            >
              Log ud
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {view === 'list' && (
          <ProjectList
            userId={session.user.id}
            onSelectProject={(project) => {
              setSelectedProject(project)
              setView('project')
            }}
            onNewProject={() => setView('new')}
          />
        )}

        {view === 'project' && selectedProject && (
          <ProjectView
            project={selectedProject}
            onBack={() => {
              setView('list')
              setSelectedProject(null)
            }}
            onDeleted={() => {
              setView('list')
              setSelectedProject(null)
            }}
          />
        )}

        {view === 'new' && (
          <NewProject
            userId={session.user.id}
            onCreated={(project) => {
              setSelectedProject(project)
              setView('project')
            }}
            onCancel={() => setView('list')}
          />
        )}
      </main>
      <OfflineIndicator />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
