import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PdfViewer from './PdfViewer'

export default function RecipeLibrary({ userId, onBack }) {
  const [recipes, setRecipes] = useState([])
  const [usedRecipeIds, setUsedRecipeIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [naming, setNaming] = useState(null) // { file, path } awaiting name
  const [recipeName, setRecipeName] = useState('')
  const [error, setError] = useState('')
  const [viewingRecipe, setViewingRecipe] = useState(null)
  const [signedPdfUrl, setSignedPdfUrl] = useState(null)
  const [pdfPage, setPdfPage] = useState(1)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    const [recipeResult, usedResult] = await Promise.all([
      supabase
        .from('recipe_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('knitting_projects')
        .select('recipe_id')
        .eq('user_id', userId)
        .not('recipe_id', 'is', null)
        .neq('status', 'Færdig'),
    ])
    setRecipes(recipeResult.data || [])
    setUsedRecipeIds(new Set((usedResult.data || []).map((p) => p.recipe_id)))
    setLoading(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Kun PDF-filer er tilladt')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('PDF-filen må maks være 20 MB')
      return
    }

    setError('')
    setUploading(true)

    const fileName = `${userId}/${Date.now()}_${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(fileName, file, { contentType: 'application/pdf' })

    if (uploadError) {
      setError('Kunne ikke uploade PDF')
      setUploading(false)
      return
    }

    setUploading(false)
    setNaming({ path: fileName })
    setRecipeName(file.name.replace(/\.pdf$/i, ''))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveRecipeName = async () => {
    if (!recipeName.trim() || !naming) return

    const { error: insertError } = await supabase
      .from('recipe_library')
      .insert({
        user_id: userId,
        name: recipeName.trim(),
        file_path: naming.path,
      })

    if (insertError) {
      setError('Kunne ikke gemme: ' + insertError.message)
      return
    }

    setNaming(null)
    setRecipeName('')
    fetchRecipes()
  }

  const handleDelete = async (recipe) => {
    setDeleting(true)
    await supabase.storage.from('recipes').remove([recipe.file_path])
    await supabase.from('recipe_library').delete().eq('id', recipe.id)
    setShowConfirm(null)
    setDeleting(false)
    fetchRecipes()
  }

  const viewRecipe = async (recipe) => {
    const { data } = await supabase.storage
      .from('recipes')
      .createSignedUrl(recipe.file_path, 3600)
    if (data) {
      setSignedPdfUrl(data.signedUrl)
      setViewingRecipe(recipe)
      setPdfPage(1)
    }
  }

  const handlePrint = async () => {
    if (!signedPdfUrl) return
    const response = await fetch(signedPdfUrl)
    const blob = await response.blob()
    const file = new File([blob], `${viewingRecipe.name}.pdf`, { type: 'application/pdf' })

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: viewingRecipe.name })
    } else {
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url)
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print())
      }
    }
  }

  const handleDownload = async () => {
    if (!signedPdfUrl) return
    const response = await fetch(signedPdfUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${viewingRecipe.name}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-nordic-500 dark:text-nordic-400">Indlæser opskrifter...</div>
  }

  // Viewing a PDF
  if (viewingRecipe && signedPdfUrl) {
    return (
      <div>
        <button
          onClick={() => { setViewingRecipe(null); setSignedPdfUrl(null) }}
          className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
        >
          &larr; Opskrifter
        </button>
        <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-4">{viewingRecipe.name}</h2>

        <div className="flex gap-3 mb-5">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-nordic-600 hover:bg-nordic-700 dark:bg-nordic-700 dark:hover:bg-nordic-600
                       text-white text-base font-semibold transition-colors shadow-sm active:scale-95 transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Udskriv
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-warm-500 hover:bg-warm-600 dark:bg-warm-700 dark:hover:bg-warm-600
                       text-white text-base font-semibold transition-colors shadow-sm active:scale-95 transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Hent
          </button>
        </div>

        <PdfViewer pdfUrl={signedPdfUrl} currentPage={pdfPage} onPageChange={setPdfPage} />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
      >
        &larr; Strikkelager
      </button>
      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-4">Opskrifter</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full mb-6 py-4 rounded-2xl bg-warm-500 hover:bg-warm-600
                   dark:bg-nordic-600 dark:hover:bg-nordic-500
                   text-white font-semibold transition-colors text-lg shadow-sm
                   active:scale-95 transform disabled:opacity-50"
      >
        {uploading ? 'Uploader...' : '+ Upload opskrift (PDF)'}
      </button>

      {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}

      {/* Naming dialog after upload */}
      {naming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-night-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-nordic-800 dark:text-nordic-100 text-lg font-bold mb-4">Navngiv opskriften</h3>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveRecipeName() }}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-night-500
                         dark:bg-night-800 dark:text-nordic-100
                         focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500 text-lg
                         dark:placeholder-nordic-500 mb-4"
              placeholder="Opskriftens navn"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Clean up uploaded file if cancelled
                  supabase.storage.from('recipes').remove([naming.path])
                  setNaming(null)
                  setRecipeName('')
                }}
                className="flex-1 py-3 rounded-xl bg-warm-100 hover:bg-warm-200
                           dark:bg-night-600 dark:hover:bg-night-500
                           text-nordic-700 dark:text-nordic-200 font-semibold transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={saveRecipeName}
                disabled={!recipeName.trim()}
                className="flex-1 py-3 rounded-xl bg-warm-500 hover:bg-warm-600
                           dark:bg-nordic-600 dark:hover:bg-nordic-500
                           text-white font-semibold transition-colors disabled:opacity-50"
              >
                Gem
              </button>
            </div>
          </div>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">📄</span>
          <p className="text-nordic-500 dark:text-nordic-400">Ingen opskrifter endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const inUse = usedRecipeIds.has(recipe.id)
            return (
              <div
                key={recipe.id}
                className={`rounded-2xl shadow-sm border p-4 flex items-center gap-4
                           ${inUse
                             ? 'bg-warm-50/60 dark:bg-night-700/60 border-warm-200 dark:border-night-500 opacity-70'
                             : 'bg-white dark:bg-night-700 border-warm-100 dark:border-night-600'}`}
              >
                <button
                  onClick={() => viewRecipe(recipe)}
                  className="flex-1 flex items-center gap-4 text-left min-w-0"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 truncate">{recipe.name}</h3>
                      {inUse && (
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
                                         bg-warm-100 text-warm-600 dark:bg-warm-900/30 dark:text-warm-400">
                          I brug
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-nordic-400 dark:text-nordic-500">
                      {new Date(recipe.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setShowConfirm(recipe)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0
                             text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-night-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-nordic-800 dark:text-nordic-100 text-xl font-bold mb-2">
              Slet "{showConfirm.name}"?
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
