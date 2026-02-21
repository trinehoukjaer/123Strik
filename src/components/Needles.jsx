import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_LABELS = { rundpind: 'Rundpind', ret: 'Ret', 'strømpepind': 'Strømpepind' }

export default function Needles({ userId }) {
  const [needles, setNeedles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNeedle, setEditingNeedle] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [sizeMm, setSizeMm] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [material, setMaterial] = useState('')
  const [type, setType] = useState('rundpind')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNeedles()
  }, [])

  const fetchNeedles = async () => {
    const { data } = await supabase
      .from('needles')
      .select('*')
      .eq('user_id', userId)
      .order('size_mm', { ascending: true })
    setNeedles(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setSizeMm('')
    setLengthCm('')
    setMaterial('')
    setType('rundpind')
    setQuantity('1')
    setError('')
    setEditingNeedle(null)
  }

  const openForm = (needle = null) => {
    if (needle) {
      setEditingNeedle(needle)
      setSizeMm(needle.size_mm?.toString() || '')
      setLengthCm(needle.length_cm?.toString() || '')
      setMaterial(needle.material || '')
      setType(needle.type || 'rundpind')
      setQuantity(needle.quantity?.toString() || '1')
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const record = {
      user_id: userId,
      size_mm: parseFloat(sizeMm),
      length_cm: lengthCm ? parseInt(lengthCm) : null,
      material: material || null,
      type,
      quantity: quantity ? parseInt(quantity) : 1,
    }

    if (editingNeedle) {
      const { error: updateError } = await supabase
        .from('needles')
        .update(record)
        .eq('id', editingNeedle.id)
      if (updateError) {
        setError('Kunne ikke opdatere: ' + updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('needles')
        .insert(record)
      if (insertError) {
        setError('Kunne ikke oprette: ' + insertError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowForm(false)
    resetForm()
    fetchNeedles()
  }

  const handleDelete = async (needle) => {
    setDeleting(true)
    await supabase.from('needles').delete().eq('id', needle.id)
    setShowConfirm(null)
    setDeleting(false)
    fetchNeedles()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">Indlæser strikkepinde...</div>
  }

  if (showForm) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-6">
          {editingNeedle ? 'Rediger pind' : 'Tilføj strikkepind'}
        </h2>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Størrelse (mm)</label>
              <input
                type="number"
                value={sizeMm}
                onChange={(e) => setSizeMm(e.target.value)}
                required
                step="0.5"
                min="1"
                max="25"
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                           dark:placeholder-nordic-500"
                placeholder="F.eks. 4.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Længde (cm)</label>
              <input
                type="number"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                           dark:placeholder-nordic-500"
                placeholder="F.eks. 80"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Materiale</label>
            <input
              type="text"
              list="material-list"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500"
              placeholder="Skriv eller vælg materiale"
            />
            <datalist id="material-list">
              <option value="Bambus" />
              <option value="Metal" />
              <option value="Træ" />
              <option value="Plast" />
              <option value="Carbon" />
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg"
            >
              <option value="rundpind">Rundpind</option>
              <option value="ret">Ret</option>
              <option value="strømpepind">Strømpepind</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Antal</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500"
              placeholder="1"
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm() }}
              className="flex-1 py-3 rounded-xl bg-warm-100 hover:bg-warm-200
                         dark:bg-night-600 dark:hover:bg-night-500
                         text-nordic-700 dark:text-nordic-200 font-semibold transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={saving || !sizeMm}
              className="flex-1 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                         dark:bg-nordic-600 dark:hover:bg-nordic-500
                         text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Gemmer...' : editingNeedle ? 'Opdater' : 'Tilføj'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-4">Strikkepinde</h2>

      <button
        onClick={() => openForm()}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   dark:bg-nordic-600 dark:hover:bg-nordic-500
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform"
      >
        + Tilføj strikkepind
      </button>

      {needles.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🥢</span>
          <p className="text-nordic-500 dark:text-nordic-400">Ingen strikkepinde endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {needles.map((needle) => (
            <div
              key={needle.id}
              className="bg-white dark:bg-night-700 rounded-2xl shadow-sm border border-warm-100 dark:border-night-600
                         p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-warm-50 dark:bg-night-800 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-nordic-700 dark:text-nordic-200">{needle.size_mm}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-nordic-800 dark:text-nordic-100">
                  {needle.size_mm} mm
                  {needle.length_cm ? ` · ${needle.length_cm} cm` : ''}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-nordic-50 text-nordic-500
                                   dark:bg-night-600 dark:text-nordic-400 font-medium">
                    {TYPE_LABELS[needle.type] || needle.type}
                  </span>
                  {needle.material && (
                    <span className="text-sm text-nordic-400 dark:text-nordic-500">{needle.material}</span>
                  )}
                </div>
                {needle.quantity > 1 && (
                  <p className="text-xs text-nordic-400 dark:text-nordic-500 mt-0.5">Antal: {needle.quantity}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openForm(needle)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl
                             text-nordic-400 hover:bg-warm-100 dark:hover:bg-night-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowConfirm(needle)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl
                             text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-night-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-nordic-800 dark:text-nordic-100 text-xl font-bold mb-2">
              Slet {showConfirm.size_mm} mm {TYPE_LABELS[showConfirm.type]}?
            </p>
            <p className="text-nordic-500 dark:text-nordic-400 mb-6">Det kan ikke fortrydes</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-warm-100 hover:bg-warm-200
                           dark:bg-night-600 dark:hover:bg-night-500
                           text-nordic-700 dark:text-nordic-200 text-lg font-semibold transition-colors"
              >
                Nej, behold
              </button>
              <button
                onClick={() => handleDelete(showConfirm)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                           text-white text-lg font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Sletter...' : 'Ja, slet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
