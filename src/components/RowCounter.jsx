import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { savePendingChange } from '../lib/offlineDb'

export default function RowCounter({ projectId, initialRow = 0, totalRows, onStatusChange }) {

  const [count, setCount] = useState(initialRow)
  const [saving, setSaving] = useState(false)
  const saveTimeout = useRef(null)

  useEffect(() => {
    setCount(initialRow)
  }, [initialRow])

  const saveToDb = (newCount) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    setSaving(true)
    saveTimeout.current = setTimeout(async () => {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('knitting_projects')
          .update({ current_row: newCount })
          .eq('id', projectId)

        if (error) {
          // Netvaerksfejl - gem lokalt
          await savePendingChange(projectId, 'current_row', newCount)
        }
      } else {
        // Offline - gem i IndexedDB
        await savePendingChange(projectId, 'current_row', newCount)
      }
      setSaving(false)
    }, 400)
  }

  const increment = () => {
    const next = totalRows ? Math.min(count + 1, totalRows) : count + 1
    setCount(next)
    saveToDb(next)
    onStatusChange?.()
  }

  const decrement = () => {
    const next = Math.max(0, count - 1)
    setCount(next)
    saveToDb(next)
    onStatusChange?.()
  }

  const reset = () => {
    setCount(0)
    saveToDb(0)
  }

  const progress = totalRows ? Math.round((count / totalRows) * 100) : null

  return (
    <div className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 border border-warm-200 dark:border-night-600">
      <div className="text-center mb-4">
        <h3 className="text-warm-700 dark:text-warm-400 font-semibold text-lg mb-1">Pindetæller</h3>
        {progress !== null && (
          <div className="w-full bg-warm-100 dark:bg-night-600 rounded-full h-3 mb-2">
            <div
              className="bg-warm-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="text-sm text-nordic-500 dark:text-nordic-400">
          {totalRows ? `${count} af ${totalRows} pinde` : `${count} pinde`}
          {saving && <span className="ml-2 text-warm-400">Gemmer...</span>}
        </p>
      </div>

      <div className="text-7xl font-bold text-nordic-800 dark:text-nordic-100 text-center my-6 tabular-nums">
        {count}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={decrement}
          className="w-20 h-20 rounded-2xl bg-warm-100 hover:bg-warm-200
                     dark:bg-night-600 dark:hover:bg-night-500
                     text-warm-800 dark:text-warm-300 text-3xl font-bold transition-colors
                     active:scale-95 transform"
        >
          &minus;
        </button>
        <button
          onClick={increment}
          className="w-32 h-20 rounded-2xl bg-warm-500 hover:bg-warm-600
                     dark:bg-nordic-600 dark:hover:bg-nordic-500
                     text-white text-3xl font-bold transition-colors shadow-md
                     active:scale-95 transform"
        >
          +1
        </button>
        <button
          onClick={reset}
          className="w-20 h-20 rounded-2xl bg-nordic-100 hover:bg-nordic-200
                     dark:bg-night-600 dark:hover:bg-night-500
                     text-nordic-600 dark:text-nordic-300 text-sm font-semibold transition-colors
                     active:scale-95 transform"
        >
          Nulstil
        </button>
      </div>
    </div>
  )
}
