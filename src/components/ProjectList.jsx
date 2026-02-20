import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatusBadge({ status }) {
  const styles = {
    'Færdig': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'I gang': 'bg-warm-50 text-warm-700 dark:bg-warm-900/30 dark:text-warm-400',
    'Oprettet': 'bg-nordic-50 text-nordic-600 dark:bg-nordic-900/30 dark:text-nordic-400',
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
      className={`w-full text-left bg-white dark:bg-night-700 rounded-2xl shadow-sm border
                 hover:shadow-md transition-all p-5
                 ${isDone
                   ? 'border-green-100 hover:border-green-300 dark:border-green-900/40 dark:hover:border-green-700'
                   : 'border-warm-100 hover:border-warm-300 dark:border-night-600 dark:hover:border-night-500'}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{isDone ? '✅' : '🧶'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 text-lg truncate">
              {project.title}
            </h3>
            <StatusBadge status={project.status || 'Oprettet'} />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-nordic-500 dark:text-nordic-400">
              Pind {project.current_row}
              {project.total_rows ? ` af ${project.total_rows}` : ''}
            </p>
            {project.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-nordic-50 text-nordic-500
                               dark:bg-night-600 dark:text-nordic-400 font-medium">
                {project.category}
              </span>
            )}
          </div>
          {project.updated_at && (
            <p className="text-xs text-nordic-400 dark:text-nordic-500 mt-1">
              Sidst strikket {new Date(project.updated_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {progress !== null && (
            <div className="w-full bg-warm-100 dark:bg-night-600 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-400' : 'bg-warm-400'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="text-nordic-300 dark:text-nordic-500 text-xl">&rsaquo;</div>
      </div>
    </button>
  )
}

const CATEGORIES = ['Sweatre', 'Cardigans', 'Tilbehør', 'Børnetøj', 'Interiør', 'Andet']

export default function ProjectList({ userId, onSelectProject, onNewProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)

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
      <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">
        Indlæser projekter...
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🧶</div>
        <p className="text-nordic-500 dark:text-nordic-400 mb-4">Ingen projekter endnu</p>
        <button
          onClick={onNewProject}
          className="px-6 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                     dark:bg-nordic-600 dark:hover:bg-nordic-500
                     text-white font-semibold transition-colors"
        >
          + Opret dit første projekt
        </button>
      </div>
    )
  }

  const usedCategories = CATEGORIES.filter((c) =>
    projects.some((p) => p.category === c)
  )

  const filtered = filter
    ? projects.filter((p) => p.category === filter)
    : projects

  const active = filtered.filter((p) => (p.status || 'Oprettet') !== 'Færdig')
  const done = filtered.filter((p) => p.status === 'Færdig')

  return (
    <div>
      <button
        onClick={onNewProject}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   dark:bg-nordic-600 dark:hover:bg-nordic-500
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform"
      >
        + Nyt projekt
      </button>

      {/* Kategori-filter */}
      {usedCategories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setFilter(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                       ${!filter
                         ? 'bg-nordic-600 text-white dark:bg-nordic-500'
                         : 'bg-warm-100 text-nordic-600 hover:bg-warm-200 dark:bg-night-700 dark:text-nordic-300 dark:hover:bg-night-600'}`}
          >
            Alle
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? null : cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                         ${filter === cat
                           ? 'bg-nordic-600 text-white dark:bg-nordic-500'
                           : 'bg-warm-100 text-nordic-600 hover:bg-warm-200 dark:bg-night-700 dark:text-nordic-300 dark:hover:bg-night-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Aktive projekter */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-nordic-800 dark:text-nordic-100 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warm-500" />
          Aktive projekter
          {active.length > 0 && (
            <span className="text-sm font-normal text-nordic-400">({active.length})</span>
          )}
        </h2>

        {active.length === 0 ? (
          <div className="text-center py-6 bg-white dark:bg-night-700 rounded-2xl border border-warm-100 dark:border-night-600">
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
          <h2 className="text-lg font-bold text-nordic-800 dark:text-nordic-100 mb-3 flex items-center gap-2">
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
