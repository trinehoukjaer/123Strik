import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProjectView from './ProjectView'

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

export default function StrikkeArkiv({ userId, onBack }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('knitting_projects')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Færdig')
      .order('updated_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  // Vis ProjectView hvis et projekt er valgt
  if (selectedProject) {
    return (
      <ProjectView
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null)
          fetchProjects()
        }}
        onDeleted={() => {
          setSelectedProject(null)
          fetchProjects()
        }}
      />
    )
  }

  const usedCategories = [...new Set(
    projects.map((p) => p.category).filter(Boolean)
  )].sort()

  const filtered = filter
    ? projects.filter((p) => p.category === filter)
    : projects

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">Indlæser arkiv...</div>
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
      >
        &larr; Strikkelager
      </button>
      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-4">Færdigt strik</h2>

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

      {filtered.length === 0 && projects.length > 0 ? (
        <div className="text-center py-6 bg-white dark:bg-night-700 rounded-2xl border border-warm-100 dark:border-night-600">
          <p className="text-nordic-400">Intet strik i denne kategori</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">✅</span>
          <p className="text-nordic-500 dark:text-nordic-400">Intet færdigt strik endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const progress = project.total_rows
              ? Math.round((project.current_row / project.total_rows) * 100)
              : null

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="w-full text-left bg-white dark:bg-night-700 rounded-2xl shadow-sm border
                           border-green-100 hover:border-green-300 dark:border-green-900/40 dark:hover:border-green-700
                           hover:shadow-md transition-all p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 text-lg truncate">
                        {project.title}
                      </h3>
                      <StatusBadge status="Færdig" />
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
                        Afsluttet {new Date(project.updated_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    {progress !== null && (
                      <div className="w-full bg-warm-100 dark:bg-night-600 rounded-full h-2 mt-2">
                        <div
                          className="h-2 rounded-full transition-all bg-green-400"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-nordic-300 dark:text-nordic-500 text-xl">&rsaquo;</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
