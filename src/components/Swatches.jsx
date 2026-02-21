import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Swatches({ userId }) {
  const [swatches, setSwatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSwatch, setEditingSwatch] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [showConfirm, setShowConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [yarnInfo, setYarnInfo] = useState('')
  const [needleSize, setNeedleSize] = useState('')
  const [gaugeStitches, setGaugeStitches] = useState('')
  const [gaugeRows, setGaugeRows] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSwatches()
  }, [])

  const fetchSwatches = async () => {
    const { data } = await supabase
      .from('swatches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setSwatches(data || [])
    setLoading(false)
    if (data) fetchSignedUrls(data)
  }

  const fetchSignedUrls = async (items) => {
    const paths = items.filter((s) => s.image_path).map((s) => s.image_path)
    if (paths.length === 0) return
    const urls = {}
    await Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from('inventory-photos')
          .createSignedUrl(path, 3600)
        if (data) urls[path] = data.signedUrl
      })
    )
    setSignedUrls((prev) => ({ ...prev, ...urls }))
  }

  const resetForm = () => {
    setYarnInfo('')
    setNeedleSize('')
    setGaugeStitches('')
    setGaugeRows('')
    setNotes('')
    setImageFile(null)
    setError('')
    setEditingSwatch(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openForm = (swatch = null) => {
    if (swatch) {
      setEditingSwatch(swatch)
      setYarnInfo(swatch.yarn_info || '')
      setNeedleSize(swatch.needle_size || '')
      setGaugeStitches(swatch.gauge_stitches?.toString() || '')
      setGaugeRows(swatch.gauge_rows?.toString() || '')
      setNotes(swatch.notes || '')
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    let imagePath = editingSwatch?.image_path || null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(fileName, imageFile, { upsert: true })
      if (uploadError) {
        setError('Kunne ikke uploade billede')
        setSaving(false)
        return
      }
      if (editingSwatch?.image_path && editingSwatch.image_path !== fileName) {
        await supabase.storage.from('inventory-photos').remove([editingSwatch.image_path])
      }
      imagePath = fileName
    }

    const record = {
      user_id: userId,
      yarn_info: yarnInfo || null,
      needle_size: needleSize || null,
      gauge_stitches: gaugeStitches ? parseFloat(gaugeStitches) : null,
      gauge_rows: gaugeRows ? parseFloat(gaugeRows) : null,
      notes: notes || null,
      image_path: imagePath,
    }

    if (editingSwatch) {
      const { error: updateError } = await supabase
        .from('swatches')
        .update(record)
        .eq('id', editingSwatch.id)
      if (updateError) {
        setError('Kunne ikke opdatere: ' + updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('swatches')
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
    fetchSwatches()
  }

  const handleDelete = async (swatch) => {
    setDeleting(true)
    if (swatch.image_path) {
      await supabase.storage.from('inventory-photos').remove([swatch.image_path])
    }
    await supabase.from('swatches').delete().eq('id', swatch.id)
    setShowConfirm(null)
    setDeleting(false)
    fetchSwatches()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">Indlæser strikkeprøver...</div>
  }

  if (showForm) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-6">
          {editingSwatch ? 'Rediger strikkeprøve' : 'Ny strikkeprøve'}
        </h2>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Garninfo</label>
            <input
              type="text"
              value={yarnInfo}
              onChange={(e) => setYarnInfo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500"
              placeholder="F.eks. Drops Alpaca, hvid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Nålestørrelse</label>
            <input
              type="text"
              value={needleSize}
              onChange={(e) => setNeedleSize(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500"
              placeholder="F.eks. 4.0 mm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Masker pr. 10 cm</label>
              <input
                type="number"
                value={gaugeStitches}
                onChange={(e) => setGaugeStitches(e.target.value)}
                step="0.5"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                           dark:placeholder-nordic-500"
                placeholder="F.eks. 22"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Pinde pr. 10 cm</label>
              <input
                type="number"
                value={gaugeRows}
                onChange={(e) => setGaugeRows(e.target.value)}
                step="0.5"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                           dark:placeholder-nordic-500"
                placeholder="F.eks. 30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Noter</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500 resize-none"
              placeholder="Valgfrie noter..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">Billede (valgfrit)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                         file:bg-warm-100 file:text-warm-700 file:font-medium
                         hover:file:bg-warm-200
                         dark:file:bg-night-600 dark:file:text-nordic-300
                         dark:hover:file:bg-night-500"
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
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                         dark:bg-nordic-600 dark:hover:bg-nordic-500
                         text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Gemmer...' : editingSwatch ? 'Opdater' : 'Tilføj'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-4">Strikkeprøver</h2>

      <button
        onClick={() => openForm()}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   dark:bg-nordic-600 dark:hover:bg-nordic-500
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform"
      >
        + Ny strikkeprøve
      </button>

      {swatches.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🔲</span>
          <p className="text-nordic-500 dark:text-nordic-400">Ingen strikkeprøver endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {swatches.map((swatch) => (
            <div
              key={swatch.id}
              className="bg-white dark:bg-night-700 rounded-2xl shadow-sm border border-warm-100 dark:border-night-600
                         p-4 flex items-center gap-4"
            >
              {swatch.image_path && signedUrls[swatch.image_path] ? (
                <img
                  src={signedUrls[swatch.image_path]}
                  alt="Strikkeprøve"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-warm-50 dark:bg-night-800 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🔲</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {swatch.yarn_info && (
                  <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 truncate">{swatch.yarn_info}</h3>
                )}
                {swatch.needle_size && (
                  <p className="text-sm text-nordic-500 dark:text-nordic-400">Nål: {swatch.needle_size}</p>
                )}
                {(swatch.gauge_stitches || swatch.gauge_rows) && (
                  <p className="text-xs text-nordic-400 dark:text-nordic-500">
                    {swatch.gauge_stitches ? `${swatch.gauge_stitches} m` : '?'} x {swatch.gauge_rows ? `${swatch.gauge_rows} p` : '?'} = 10x10cm
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openForm(swatch)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl
                             text-nordic-400 hover:bg-warm-100 dark:hover:bg-night-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowConfirm(swatch)}
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
            <p className="text-nordic-800 dark:text-nordic-100 text-xl font-bold mb-2">Slet strikkeprøve?</p>
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
