import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { startOfflineSync } from './lib/offlineSync'
import Auth from './components/Auth'
import ProjectList from './components/ProjectList'
import ProjectView from './components/ProjectView'
import NewProject from './components/NewProject'
import OfflineIndicator from './components/OfflineIndicator'

export default function App() {
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
      <div className="min-h-dvh flex items-center justify-center bg-warm-50">
        <div className="text-warm-400 text-xl">Indlæser...</div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-dvh bg-warm-50">
      {/* Header */}
      <header className="no-print bg-white border-b border-warm-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧶</span>
            <h1 className="text-xl font-bold text-nordic-800">StrikkeApp</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-nordic-500 hover:text-nordic-700"
          >
            Log ud
          </button>
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
