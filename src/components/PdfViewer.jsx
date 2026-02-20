import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function PdfViewer({ pdfUrl, currentPage, onPageChange }) {
  const [numPages, setNumPages] = useState(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
  }, [])

  return (
    <div className="flex flex-col items-center w-full">
      {/* Page navigation */}
      <div className="no-print flex items-center gap-4 mb-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-4 py-2 rounded-lg bg-nordic-200 text-nordic-800 font-semibold
                     dark:bg-night-600 dark:text-nordic-200
                     disabled:opacity-40 hover:bg-nordic-300 dark:hover:bg-night-500
                     transition-colors text-lg"
        >
          &larr; Forrige
        </button>
        <span className="text-nordic-700 dark:text-nordic-300 font-medium">
          Side {currentPage} af {numPages ?? '...'}
        </span>
        <button
          onClick={() => onPageChange(Math.min(numPages || currentPage, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="px-4 py-2 rounded-lg bg-nordic-200 text-nordic-800 font-semibold
                     dark:bg-night-600 dark:text-nordic-200
                     disabled:opacity-40 hover:bg-nordic-300 dark:hover:bg-night-500
                     transition-colors text-lg"
        >
          Næste &rarr;
        </button>
      </div>

      {/* PDF document */}
      <div className="border border-warm-200 dark:border-night-600 rounded-xl overflow-hidden shadow-md bg-white max-w-full">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-64 text-nordic-500 dark:text-nordic-400">
              Indlæser PDF...
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400">
              Kunne ikke indlæse PDF
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={Math.min(window.innerWidth - 32, 600)}
            renderTextLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}
