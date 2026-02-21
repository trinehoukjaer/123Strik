import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PdfViewer from './PdfViewer'
import RowCounter from './RowCounter'
import ProjectNotes from './ProjectNotes'
import ProjectPhoto from './ProjectPhoto'

export default function ProjectView({ project, onBack, onDeleted }) {
  const [pdfPage, setPdfPage] = useState(1)
  const [signedPdfUrl, setSignedPdfUrl] = useState(null)
  const [status, setStatus] = useState(project.status || 'Oprettet')
  const statusRef = useRef(status)
  statusRef.current = status
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [wakeLockActive, setWakeLockActive] = useState(false)
  const [images, setImages] = useState(project.images || [])
  const [category, setCategory] = useState(project.category || '')
  const [editingCategory, setEditingCategory] = useState(false)
  const [categoryInput, setCategoryInput] = useState(project.category || '')
  const [existingCategories, setExistingCategories] = useState([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('knitting_projects')
        .select('category')
        .not('category', 'is', null)
      if (data) {
        const unique = [...new Set(data.map((d) => d.category))].sort()
        setExistingCategories(unique)
      }
    }
    fetchCategories()
  }, [])

  const saveCategory = async () => {
    const newCategory = categoryInput.trim() || null
    setCategory(newCategory || '')
    setEditingCategory(false)
    await supabase
      .from('knitting_projects')
      .update({ category: newCategory })
      .eq('id', project.id)
  }

  const handleActivity = () => {
    // Status styres manuelt fra dashboardet
  }

  const [justCompleted, setJustCompleted] = useState(false)

  const markAsDone = async () => {
    if (status === 'Færdig') {
      // Gendan som aktiv
      setStatus('I gang')
      setJustCompleted(false)
      await supabase
        .from('knitting_projects')
        .update({ status: 'I gang' })
        .eq('id', project.id)
    } else {
      // Marker som færdig med animation
      setStatus('Færdig')
      setJustCompleted(true)
      await supabase
        .from('knitting_projects')
        .update({ status: 'Færdig' })
        .eq('id', project.id)
      setTimeout(() => onBack(), 2000)
    }
  }
  const wakeLockRef = useRef(null)

  // Wake Lock - hold skaermen taendt
  useEffect(() => {
    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        setWakeLockActive(true)
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false)
        })
      } catch (e) {
        // Wake lock kan fejle hvis fanen ikke er synlig
      }
    }

    requestWakeLock()

    // Genaktiver wake lock naar brugeren vender tilbage til fanen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Slip laas ved unmount (naar brugeren gaar tilbage eller logger ud)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [])

  const handlePrint = async () => {
    if (!signedPdfUrl) return
    const response = await fetch(signedPdfUrl)
    const blob = await response.blob()
    const file = new File([blob], `${project.title}.pdf`, { type: 'application/pdf' })

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile && navigator.canShare?.({ files: [file] })) {
      // Mobil: brug del-funktion (print, mail, AirDrop osv.)
      await navigator.share({ files: [file], title: project.title })
    } else {
      // Desktop: aaben PDF i ny fane og print
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
    a.download = `${project.title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    setDeleting(true)
    if (images.length > 0) {
      await supabase.storage.from('project-photos').remove(images)
    }
    if (project.pdf_url) {
      await supabase.storage.from('recipes').remove([project.pdf_url])
    }
    const { error } = await supabase
      .from('knitting_projects')
      .delete()
      .eq('id', project.id)

    if (!error) {
      onDeleted()
    }
    setDeleting(false)
  }

  useEffect(() => {
    if (project.pdf_url) {
      supabase.storage
        .from('recipes')
        .createSignedUrl(project.pdf_url, 3600)
        .then(({ data, error }) => {
          if (!error && data) setSignedPdfUrl(data.signedUrl)
        })
    }
  }, [project.pdf_url])

  return (
    <div>
      <div className="no-print">
        <button
          onClick={onBack}
          className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
        >
          &larr; Mine strik
        </button>

        <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-1">{project.title}</h2>

        {/* Kategori */}
        <div className="mb-3">
          {editingCategory ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                list="category-edit-list"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveCategory() } }}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg border border-warm-200 dark:border-night-500
                           dark:bg-night-800 dark:text-nordic-100 text-sm
                           focus:outline-none focus:ring-2 focus:ring-warm-400 dark:focus:ring-nordic-500
                           dark:placeholder-nordic-500"
                placeholder="Skriv kategori"
              />
              <datalist id="category-edit-list">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <button
                onClick={saveCategory}
                className="px-3 py-1.5 rounded-lg bg-nordic-600 dark:bg-nordic-500 text-white text-sm font-medium
                           hover:bg-nordic-700 dark:hover:bg-nordic-400 transition-colors"
              >
                Gem
              </button>
              <button
                onClick={() => { setEditingCategory(false); setCategoryInput(category) }}
                className="px-3 py-1.5 rounded-lg bg-warm-100 dark:bg-night-600 text-nordic-600 dark:text-nordic-300
                           text-sm font-medium hover:bg-warm-200 dark:hover:bg-night-500 transition-colors"
              >
                Annuller
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setCategoryInput(category); setEditingCategory(true) }}
              className="inline-flex items-center gap-1.5 text-sm text-nordic-500 dark:text-nordic-400
                         hover:text-nordic-700 dark:hover:text-nordic-200 transition-colors"
            >
              <span className="px-2.5 py-0.5 rounded-full bg-nordic-50 dark:bg-night-600 text-nordic-500 dark:text-nordic-400 font-medium text-xs">
                {category || 'Ingen kategori'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {wakeLockActive && (
          <p className="flex items-center gap-1.5 text-xs text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1z" />
              <circle cx="10" cy="10" r="3" />
            </svg>
            Skaermen holdes taendt
          </p>
        )}

        {/* Udskriv og Hent - kompakt rad */}
        {project.pdf_url && signedPdfUrl && (
          <div className="flex gap-3 mb-5">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-nordic-600 hover:bg-nordic-700 dark:bg-nordic-700 dark:hover:bg-nordic-600
                         text-white text-base font-semibold
                         transition-colors shadow-sm active:scale-95 transform"
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
                         text-white text-base font-semibold
                         transition-colors shadow-sm active:scale-95 transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Hent opskrift
            </button>
          </div>
        )}

        {/* Pindetaeller */}
        <div className="mb-6">
          <RowCounter
            projectId={project.id}
            initialRow={project.current_row}
            totalRows={project.total_rows}
            onStatusChange={handleActivity}
          />
        </div>

        {/* Noter */}
        <div className="mb-6">
          <ProjectNotes
            projectId={project.id}
            initialNotes={project.notes || ''}
            onStatusChange={handleActivity}
          />
        </div>

        {/* Projekt-billeder */}
        <div className="mb-6">
          <ProjectPhoto
            projectId={project.id}
            images={images}
            onImagesChange={setImages}
          />
        </div>
      </div>

      {/* PDF viewer - synlig baade paa skaerm og i print */}
      {project.pdf_url && signedPdfUrl && (
        <PdfViewer
          pdfUrl={signedPdfUrl}
          currentPage={pdfPage}
          onPageChange={setPdfPage}
        />
      )}

      {project.pdf_url && !signedPdfUrl && (
        <div className="bg-white dark:bg-night-700 rounded-2xl shadow-sm border border-warm-100 dark:border-night-600 p-8 text-center">
          <p className="text-nordic-400">Indlaeser PDF...</p>
        </div>
      )}

      {!project.pdf_url && (
        <div className="bg-white dark:bg-night-700 rounded-2xl shadow-sm border border-warm-100 dark:border-night-600 p-8 text-center">
          <p className="text-nordic-400">Ingen PDF-opskrift tilknyttet dette strik</p>
        </div>
      )}

      {/* Status-knap */}
      <div className="no-print mt-8 mb-4">
        {justCompleted && (
          <div className="text-center mb-4 animate-bounce">
            <span className="text-4xl">🎉</span>
            <p className="text-green-600 dark:text-green-400 font-bold text-lg mt-1">Tillykke! Dit strik er færdigt!</p>
          </div>
        )}
        <button
          onClick={markAsDone}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                      text-lg font-semibold transition-all duration-300
                      ${status === 'Færdig'
                        ? 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-sm active:scale-95 transform'}`}
        >
          {status === 'Færdig' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gendan som aktivt strik
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Marker som færdig
            </>
          )}
        </button>
      </div>

      {/* Slet-knap - diskret i bunden */}
      <div className="no-print mb-8 text-center">
        <button
          onClick={() => setShowConfirm(true)}
          className="px-6 py-2 rounded-xl border border-red-200 text-red-400
                     hover:bg-red-50 hover:text-red-500
                     dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20
                     text-sm font-medium transition-colors"
        >
          Slet dette strik
        </button>
      </div>

      {/* Bekraeftelses-popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-night-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-nordic-800 dark:text-nordic-100 text-xl font-bold mb-2">
              Vil du slette "{project.title}"?
            </p>
            <p className="text-nordic-500 dark:text-nordic-400 mb-6">
              Det kan ikke fortrydes
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-warm-100 hover:bg-warm-200
                           dark:bg-night-600 dark:hover:bg-night-500
                           text-nordic-700 dark:text-nordic-200 text-lg font-semibold transition-colors"
              >
                Nej, behold
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                           text-white text-lg font-semibold transition-colors
                           disabled:opacity-50"
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
