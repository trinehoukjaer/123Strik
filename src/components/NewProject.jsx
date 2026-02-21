import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function NewProject({ userId, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [totalRows, setTotalRows] = useState('')
  const [existingCategories, setExistingCategories] = useState([])
  const [recipes, setRecipes] = useState([])
  const [recipeSource, setRecipeSource] = useState('none') // 'none' | 'archive' | 'new'
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [saveToArchive, setSaveToArchive] = useState(false)
  const [archiveName, setArchiveName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const [catResult, recipeResult, usedResult] = await Promise.all([
        supabase
          .from('knitting_projects')
          .select('category')
          .eq('user_id', userId)
          .not('category', 'is', null),
        supabase
          .from('recipe_library')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
        supabase
          .from('knitting_projects')
          .select('recipe_id')
          .eq('user_id', userId)
          .not('recipe_id', 'is', null)
          .neq('status', 'Færdig'),
      ])
      if (catResult.data) {
        const unique = [...new Set(catResult.data.map((d) => d.category))].sort()
        setExistingCategories(unique)
      }
      if (recipeResult.data) {
        const usedIds = new Set((usedResult.data || []).map((p) => p.recipe_id))
        setRecipes(recipeResult.data.filter((r) => !usedIds.has(r.id)))
      }
    }
    fetchData()
  }, [userId])

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let pdfUrl = null
    let recipeId = null

    if (recipeSource === 'archive' && selectedRecipe) {
      // Brug PDF fra eksisterende opskrift
      pdfUrl = selectedRecipe.file_path
      recipeId = selectedRecipe.id
    } else if (recipeSource === 'new' && pdfFile) {
      // Upload ny PDF
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

      const fileName = `${userId}/${Date.now()}_${crypto.randomUUID()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(fileName, pdfFile, { contentType: 'application/pdf' })

      if (uploadError) {
        setError('Kunne ikke uploade PDF')
        setLoading(false)
        return
      }

      pdfUrl = fileName

      // Gem også i opskriftsarkivet hvis ønsket
      if (saveToArchive && archiveName.trim()) {
        const { data: archiveData, error: archiveError } = await supabase
          .from('recipe_library')
          .insert({
            user_id: userId,
            name: archiveName.trim(),
            file_path: fileName,
          })
          .select()
          .single()

        if (!archiveError && archiveData) {
          recipeId = archiveData.id
        }
      }
    }

    // Opret projekt
    const { data, error: insertError } = await supabase
      .from('knitting_projects')
      .insert({
        user_id: userId,
        title,
        category: category || null,
        pdf_url: pdfUrl,
        recipe_id: recipeId,
        current_row: 0,
        total_rows: totalRows ? parseInt(totalRows) : null,
      })
      .select()
      .single()

    if (insertError) {
      setError('Kunne ikke oprette strik: ' + insertError.message)
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

      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-6">Nyt strik</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-night-700 rounded-2xl shadow-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-1">
            Navn på strik
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
            Kategori (valgfrit)
          </label>
          <input
            type="text"
            list="category-list"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                       dark:bg-night-800 dark:text-nordic-100
                       focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                       dark:placeholder-nordic-500"
            placeholder="Skriv eller vælg kategori"
          />
          <datalist id="category-list">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
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

        {/* Opskrift-sektion */}
        <div>
          <label className="block text-sm font-medium text-nordic-700 dark:text-nordic-300 mb-2">
            Opskrift (valgfrit)
          </label>
          <div className="flex gap-2 mb-3">
            {[
              { id: 'none', label: 'Ingen' },
              { id: 'archive', label: 'Fra opskrifter', disabled: recipes.length === 0 },
              { id: 'new', label: 'Upload ny' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  setRecipeSource(opt.id)
                  if (opt.id !== 'archive') setSelectedRecipeId('')
                  if (opt.id !== 'new') { setPdfFile(null); setSaveToArchive(false); setArchiveName('') }
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                           ${recipeSource === opt.id
                             ? 'bg-nordic-600 text-white dark:bg-nordic-500'
                             : 'bg-warm-100 text-nordic-600 hover:bg-warm-200 dark:bg-night-600 dark:text-nordic-300 dark:hover:bg-night-500'}
                           disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Vælg fra arkiv */}
          {recipeSource === 'archive' && (
            <div className="space-y-3">
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg"
              >
                <option value="">Vælg opskrift...</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {selectedRecipe && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20
                                border border-green-200 dark:border-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                    PDF fra "{selectedRecipe.name}" bruges
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upload ny PDF */}
          {recipeSource === 'new' && (
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files[0]
                  setPdfFile(file)
                  if (file && !archiveName) {
                    setArchiveName(file.name.replace(/\.pdf$/i, ''))
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100
                           file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                           file:bg-warm-100 file:text-warm-700 file:font-medium
                           hover:file:bg-warm-200
                           dark:file:bg-night-600 dark:file:text-nordic-300
                           dark:hover:file:bg-night-500"
              />
              {pdfFile && (
                <label className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 dark:bg-night-600
                                  border border-warm-200 dark:border-night-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToArchive}
                    onChange={(e) => setSaveToArchive(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-warm-300 dark:border-night-400
                               text-nordic-600 focus:ring-nordic-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-nordic-700 dark:text-nordic-200">
                      Gem også i opskriftsarkivet
                    </span>
                    {saveToArchive && (
                      <input
                        type="text"
                        value={archiveName}
                        onChange={(e) => setArchiveName(e.target.value)}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-warm-200 dark:border-night-500
                                   dark:bg-night-800 dark:text-nordic-100 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500
                                   dark:placeholder-nordic-500"
                        placeholder="Navn i arkivet"
                      />
                    )}
                  </div>
                </label>
              )}
            </div>
          )}
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
          {loading ? 'Opretter...' : 'Opret strik'}
        </button>
      </form>
    </div>
  )
}
