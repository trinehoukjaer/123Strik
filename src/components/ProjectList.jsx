import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatusBadge({ status }) {
  const styles = {
    'Færdig': 'bg-green-50 text-green-700',
    'I gang': 'bg-warm-50 text-warm-700',
    'Oprettet': 'bg-nordic-50 text-nordic-600',
  }
  const dots = {
    'Færdig': 'bg-green-500',
    'I gang': 'bg-warm-500',
    'Oprettet': 'bg-nordic-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full
                      ${styles[status] || styles['Oprettet']}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots['Oprettet']}`} />
      {status}
    </span>
  )
}

function ProjectCard({ project, onClick }) {
  const progress = project.total_rows
    ? Math.round((project.current_row / project.total_rows) * 100)
    : null
  const isDone = project.status === 'Færdig'

  return (
    <button
      onClick={() => onClick(project)}
      className={`w-full text-left bg-white rounded-2xl shadow-sm border
                 hover:shadow-md transition-all p-5
                 ${isDone ? 'border-green-100 hover:border-green-300' : 'border-warm-100 hover:border-warm-300'}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{isDone ? '✅' : '🧶'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-nordic-800 text-lg truncate">
              {project.title}
            </h3>
            <StatusBadge status={project.status || 'Oprettet'} />
          </div>
          <p className="text-sm text-nordic-500">
            Pind {project.current_row}
            {project.total_rows ? ` af ${project.total_rows}` : ''}
          </p>
          {project.updated_at && (
            <p className="text-xs text-nordic-400 mt-1">
              Sidst strikket {new Date(project.updated_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {progress !== null && (
            <div className="w-full bg-warm-100 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-400' : 'bg-warm-400'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="text-nordic-300 text-xl">&rsaquo;</div>
      </div>
    </button>
  )
}

export default function ProjectList({ userId, onSelectProject, onNewProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('knitting_projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Fejl ved hentning af projekter:', error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-nordic-500">
        Indlæser projekter...
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🧶</div>
        <p className="text-nordic-500 mb-4">Ingen projekter endnu</p>
        <button
          onClick={onNewProject}
          className="px-6 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                     text-white font-semibold transition-colors"
        >
          + Opret dit første projekt
        </button>
      </div>
    )
  }

  const active = projects.filter((p) => (p.status || 'Oprettet') !== 'Færdig')
  const done = projects.filter((p) => p.status === 'Færdig')

  return (
    <div>
      <button
        onClick={onNewProject}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform"
      >
        + Nyt projekt
      </button>

      {/* Aktive projekter */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-nordic-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warm-500" />
          Aktive projekter
          {active.length > 0 && (
            <span className="text-sm font-normal text-nordic-400">({active.length})</span>
          )}
        </h2>

        {active.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-2xl border border-warm-100">
            <p className="text-nordic-400">Ingen aktive projekter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={onSelectProject} />
            ))}
          </div>
        )}
      </div>

      {/* Faerdige projekter */}
      {done.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-nordic-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Faerdige projekter
            <span className="text-sm font-normal text-nordic-400">({done.length})</span>
          </h2>
          <div className="space-y-3">
            {done.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={onSelectProject} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
