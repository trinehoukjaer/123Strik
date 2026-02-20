import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewProject({ userId, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [totalRows, setTotalRows] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let pdfUrl = null

    // Upload PDF if selected
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        setError('Kun PDF-filer er tilladt')
        setLoading(false)
        return
      }
      if (pdfFile.size > 20 * 1024 * 1024) {
        setError('PDF-filen maa maks vaere 20 MB')
        setLoading(false)
        return
      }

      const fileExt = 'pdf'
      const fileName = `${userId}/${Date.now()}_${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(fileName, pdfFile, { contentType: 'application/pdf' })

      if (uploadError) {
        setError('Kunne ikke uploade PDF')
        setLoading(false)
        return
      }

      // Gem stien - vi henter signeret URL naar vi viser PDF'en
      pdfUrl = fileName
    }

    // Create project
    const { data, error: insertError } = await supabase
      .from('knitting_projects')
      .insert({
        user_id: userId,
        title,
        pdf_url: pdfUrl,
        current_row: 0,
        total_rows: totalRows ? parseInt(totalRows) : null,
      })
      .select()
      .single()

    if (insertError) {
      setError('Kunne ikke oprette projekt: ' + insertError.message)
    } else {
      onCreated(data)
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={onCancel}
        className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
      >
        &larr; Tilbage
      </button>

      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-6">Nyt strikkeprojekt</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">
            Projektnavn
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                       dark:bg-night-800 dark:text-nordic-100
                       focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                       dark:placeholder-nordic-500"
            placeholder="F.eks. Vintertrøje"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">
            Antal pinde i alt (valgfrit)
          </label>
          <input
            type="number"
            value={totalRows}
            onChange={(e) => setTotalRows(e.target.value)}
            min="1"
            className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                       dark:bg-night-800 dark:text-nordic-100
                       focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                       dark:placeholder-nordic-500"
            placeholder="F.eks. 200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">
            Upload PDF-opskrift (valgfrit)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
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

        <button
          type="submit"
          disabled={loading || !title}
          className="w-full py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                     dark:bg-nordic-600 dark:hover:bg-nordic-500
                     text-white font-semibold text-lg transition-colors
                     disabled:opacity-50"
        >
          {loading ? 'Opretter...' : 'Opret projekt'}
        </button>
      </form>
    </div>
  )
}
