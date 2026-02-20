import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewProject({ userId, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
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
        category: category || null,
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
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                       dark:bg-night-800 dark:text-nordic-100
                       focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                       appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23829ab1%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                       bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
          >
            <option value="">Vælg kategori (valgfrit)</option>
            <option value="Sweatre">Sweatre</option>
            <option value="Cardigans">Cardigans</option>
            <option value="Tilbehør">Tilbehør</option>
            <option value="Børnetøj">Børnetøj</option>
            <option value="Interiør">Interiør</option>
            <option value="Andet">Andet</option>
          </select>
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
