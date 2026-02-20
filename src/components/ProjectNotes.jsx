import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { savePendingChange } from '../lib/offlineDb'

export default function ProjectNotes({ projectId, initialNotes = '', onStatusChange }) {

  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimeout = useRef(null)
  const textareaRef = useRef(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  useEffect(() => {
    autoResize()
  }, [notes, autoResize])

  const saveToDb = (text) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    setSaving(true)
    setSaved(false)
    saveTimeout.current = setTimeout(async () => {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('knitting_projects')
          .update({ notes: text })
          .eq('id', projectId)

        if (error) {
          await savePendingChange(projectId, 'notes', text)
        }
      } else {
        await savePendingChange(projectId, 'notes', text)
      }
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 600)
  }

  const handleChange = (e) => {
    setNotes(e.target.value)
    saveToDb(e.target.value)
    onStatusChange?.()
  }

  return (
    <div className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 border border-warm-200 dark:border-night-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-warm-700 dark:text-warm-400 font-semibold text-lg">Mine noter</h3>
        <span className="text-sm text-nordic-400">
          {saving && 'Gemmer...'}
          {saved && 'Gemt'}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={notes}
        onChange={handleChange}
        placeholder="Her kan du skrive dine noter til projektet (f.eks. pindestørrelse, farvekode eller ændringer)..."
        rows={4}
        className="w-full px-4 py-3 rounded-xl border-2 border-warm-100 bg-warm-50
                   dark:border-night-600 dark:bg-night-800 dark:text-nordic-100
                   focus:outline-none focus:border-warm-400 focus:bg-white focus:shadow-sm
                   dark:focus:border-nordic-500 dark:focus:bg-night-700
                   text-nordic-800 text-base resize-none leading-relaxed
                   transition-all duration-200 min-h-[6rem] overflow-hidden
                   dark:placeholder-nordic-500"
      />
    </div>
  )
}
