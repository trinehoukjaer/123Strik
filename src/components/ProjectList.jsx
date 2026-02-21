import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function NeedleIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* To krydsede strikkepinde */}
      <line x1="4" y1="20" x2="20" y2="4"
        stroke={active ? 'currentColor' : 'currentColor'}
        strokeWidth={active ? 2.5 : 1.5}
        strokeLinecap="round"
      />
      <circle cx="20" cy="4" r={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <line x1="8" y1="20" x2="22" y2="8"
        stroke={active ? 'currentColor' : 'currentColor'}
        strokeWidth={active ? 2.5 : 1.5}
        strokeLinecap="round"
      />
      <circle cx="22" cy="8" r={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  )
}

function ProjectCard({ project, onClick, onToggleActive }) {
  const progress = project.total_rows
    ? Math.round((project.current_row / project.total_rows) * 100)
    : null
  const isActive = project.status === 'I gang'

  return (
    <div
      className={`bg-white dark:bg-night-700 rounded-2xl shadow-sm border
                 hover:shadow-md transition-all p-5
                 ${isActive
                   ? 'border-warm-200 dark:border-warm-800/40'
                   : 'border-warm-100 dark:border-night-600'}`}
    >
      <div className="flex items-center gap-4">
        {/* Strikkepinde-ikon til at markere aktiv */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleActive(project)
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                     ${isActive
                       ? 'bg-warm-100 text-warm-600 dark:bg-warm-900/30 dark:text-warm-400'
                       : 'bg-warm-50 text-nordic-300 dark:bg-night-600 dark:text-nordic-500 hover:text-nordic-400 dark:hover:text-nordic-400'}`}
          title={isActive ? 'Læg fra dig' : 'Tag op på pindene'}
        >
          <NeedleIcon active={isActive} />
        </button>

        {/* Klikbar projektinfo */}
        <button
          onClick={() => onClick(project)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 text-lg truncate">
              {project.title}
            </h3>
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
                className={`h-2 rounded-full transition-all ${isActive ? 'bg-warm-400' : 'bg-nordic-300 dark:bg-nordic-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </button>

        <button
          onClick={() => onClick(project)}
          className="text-nordic-300 dark:text-nordic-500 text-xl shrink-0"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}

export default function ProjectList({ userId, onSelectProject, onNewProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [showOthers, setShowOthers] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('knitting_projects')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'Færdig')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Fejl ved hentning af projekter:', error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  const toggleActive = async (project) => {
    const newStatus = project.status === 'I gang' ? 'Oprettet' : 'I gang'
    await supabase
      .from('knitting_projects')
      .update({ status: newStatus })
      .eq('id', project.id)
    setProjects((prev) =>
      prev.map((p) => p.id === project.id ? { ...p, status: newStatus } : p)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">
        Indlæser strik...
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🧶</div>
        <p className="text-nordic-500 dark:text-nordic-400 mb-4">Intet strik endnu</p>
        <button
          onClick={onNewProject}
          className="px-6 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                     dark:bg-nordic-600 dark:hover:bg-nordic-500
                     text-white font-semibold transition-colors"
        >
          + Opret dit første strik
        </button>
      </div>
    )
  }

  const usedCategories = [...new Set(
    projects.map((p) => p.category).filter(Boolean)
  )].sort()

  const filtered = filter
    ? projects.filter((p) => p.category === filter)
    : projects

  const active = filtered.filter((p) => p.status === 'I gang')
  const others = filtered.filter((p) => p.status !== 'I gang')

  return (
    <div>
      <button
        onClick={onNewProject}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   dark:bg-nordic-600 dark:hover:bg-nordic-500
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform"
      >
        + Nyt strik
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

      {/* Projekter i gang */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-nordic-800 dark:text-nordic-100 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warm-500" />
          Aktuelt strik
          {active.length > 0 && (
            <span className="text-sm font-normal text-nordic-400">({active.length})</span>
          )}
        </h2>

        {active.length === 0 ? (
          <div className="text-center py-6 bg-white dark:bg-night-700 rounded-2xl border border-warm-100 dark:border-night-600">
            <p className="text-nordic-400 text-sm">Tryk på strikkepindene for at tage et strik op</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={onSelectProject}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Kommende projekter */}
      {others.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h2 className="text-lg font-bold text-nordic-800 dark:text-nordic-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-nordic-300 dark:bg-nordic-500" />
              Kommende strik
              <span className="text-sm font-normal text-nordic-400">({others.length})</span>
            </h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 text-nordic-400 transition-transform ${showOthers ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOthers && (
            <div className="space-y-3">
              {others.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={onSelectProject}
                  onToggleActive={toggleActive}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
