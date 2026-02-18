import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PdfViewer from './PdfViewer'
import RowCounter from './RowCounter'
import ProjectNotes from './ProjectNotes'

export default function ProjectView({ project, onBack, onDeleted }) {
  const [pdfPage, setPdfPage] = useState(1)
  const [signedPdfUrl, setSignedPdfUrl] = useState(null)
  const [status, setStatus] = useState(project.status || 'Oprettet')
  const statusRef = useRef(status)
  statusRef.current = status
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [wakeLockActive, setWakeLockActive] = useState(false)

  const handleActivity = async () => {
    if (!statusRef.current || statusRef.current === 'Oprettet') {
      setStatus('I gang')
      statusRef.current = 'I gang'
      await supabase.from('knitting_projects').update({ status: 'I gang' }).eq('id', project.id)
    }
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
          className="text-nordic-500 hover:text-nordic-700 mb-4 font-medium"
        >
          &larr; Mine projekter
        </button>

        <h2 className="text-2xl font-bold text-nordic-800 mb-2">{project.title}</h2>

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
                         bg-nordic-600 hover:bg-nordic-700 text-white text-base font-semibold
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
                         bg-warm-500 hover:bg-warm-600 text-white text-base font-semibold
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
        <div className="bg-white rounded-2xl shadow-sm border border-warm-100 p-8 text-center">
          <p className="text-nordic-400">Indlaeser PDF...</p>
        </div>
      )}

      {!project.pdf_url && (
        <div className="bg-white rounded-2xl shadow-sm border border-warm-100 p-8 text-center">
          <p className="text-nordic-400">Ingen PDF-opskrift tilknyttet dette projekt</p>
        </div>
      )}

      {/* Status-knap */}
      <div className="no-print mt-8 mb-4">
        {justCompleted && (
          <div className="text-center mb-4 animate-bounce">
            <span className="text-4xl">🎉</span>
            <p className="text-green-600 font-bold text-lg mt-1">Tillykke! Projektet er færdigt!</p>
          </div>
        )}
        <button
          onClick={markAsDone}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                      text-lg font-semibold transition-all duration-300
                      ${status === 'Færdig'
                        ? 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-sm active:scale-95 transform'}`}
        >
          {status === 'Færdig' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gendan som aktivt projekt
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
                     hover:bg-red-50 hover:text-red-500 text-sm font-medium transition-colors"
        >
          Slet dette projekt
        </button>
      </div>

      {/* Bekraeftelses-popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-nordic-800 text-xl font-bold mb-2">
              Vil du slette "{project.title}"?
            </p>
            <p className="text-nordic-500 mb-6">
              Det kan ikke fortrydes
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-warm-100 hover:bg-warm-200
                           text-nordic-700 text-lg font-semibold transition-colors"
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
