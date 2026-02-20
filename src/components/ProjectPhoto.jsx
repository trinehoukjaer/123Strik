import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ProjectPhoto({ projectId, images, onImagesChange }) {
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState({})
  const [fullscreenIndex, setFullscreenIndex] = useState(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)

  // Generate signed URLs for all images
  useEffect(() => {
    if (!images || images.length === 0) {
      setSignedUrls({})
      return
    }

    const fetchUrls = async () => {
      const urls = {}
      await Promise.all(
        images.map(async (path) => {
          if (signedUrls[path]) {
            urls[path] = signedUrls[path]
            return
          }
          const { data, error } = await supabase.storage
            .from('project-photos')
            .createSignedUrl(path, 3600)
          if (!error && data) urls[path] = data.signedUrl
        })
      )
      setSignedUrls(urls)
    }
    fetchUrls()
  }, [images])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${projectId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const newImages = [...images, filePath]

      const { error: updateError } = await supabase
        .from('knitting_projects')
        .update({ images: newImages })
        .eq('id', projectId)

      if (updateError) throw updateError

      // Get signed URL for the new image
      const { data } = await supabase.storage
        .from('project-photos')
        .createSignedUrl(filePath, 3600)

      if (data) {
        setSignedUrls((prev) => ({ ...prev, [filePath]: data.signedUrl }))
      }
      onImagesChange(newImages)

      // Scroll to the new image
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Upload fejl:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (path) => {
    try {
      await supabase.storage.from('project-photos').remove([path])

      const newImages = images.filter((p) => p !== path)

      await supabase
        .from('knitting_projects')
        .update({ images: newImages })
        .eq('id', projectId)

      setSignedUrls((prev) => {
        const next = { ...prev }
        delete next[path]
        return next
      })
      onImagesChange(newImages)
      if (fullscreenIndex !== null) setFullscreenIndex(null)
    } catch (err) {
      console.error('Slet billede fejl:', err)
    }
  }

  const hasImages = images && images.length > 0 && Object.keys(signedUrls).length > 0

  return (
    <>
      <div className="bg-white dark:bg-night-700 rounded-2xl shadow-sm border border-warm-100 dark:border-night-600 overflow-hidden">
        {/* Thumbnail gallery — horizontal scroll */}
        {hasImages && (
          <div
            ref={scrollRef}
            className="flex gap-2 p-3 overflow-x-auto"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {images.map((path, i) =>
              signedUrls[path] ? (
                <div
                  key={path}
                  className="relative shrink-0"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div
                    className="w-24 h-24 rounded-xl overflow-hidden bg-warm-50 dark:bg-night-800 cursor-pointer
                               border-2 border-transparent hover:border-nordic-300 dark:hover:border-nordic-500 transition-colors"
                    onClick={() => setFullscreenIndex(i)}
                  >
                    <img
                      src={signedUrls[path]}
                      alt={`Billede ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(path)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full
                               bg-red-500 text-white text-xs flex items-center justify-center
                               shadow-sm hover:bg-red-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Add button */}
        <div className={hasImages ? 'px-3 pb-3' : 'p-3'}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border-2 border-dashed border-warm-200 text-warm-400
                       dark:border-night-500 dark:text-nordic-400
                       hover:border-nordic-300 hover:text-nordic-500
                       dark:hover:border-nordic-500 dark:hover:text-nordic-300
                       transition-colors text-sm font-medium"
          >
            {uploading ? (
              <span>Uploader...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {hasImages ? 'Tilføj billede' : 'Tag / vælg billede'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreenIndex !== null && images[fullscreenIndex] && signedUrls[images[fullscreenIndex]] && (
        <div
          className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4"
          onClick={() => setFullscreenIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10"
            onClick={() => setFullscreenIndex(null)}
          >
            &times;
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/15 hover:bg-white/30 text-white text-xl
                           flex items-center justify-center transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setFullscreenIndex((fullscreenIndex - 1 + images.length) % images.length)
                }}
              >
                &lsaquo;
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/15 hover:bg-white/30 text-white text-xl
                           flex items-center justify-center transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setFullscreenIndex((fullscreenIndex + 1) % images.length)
                }}
              >
                &rsaquo;
              </button>
            </>
          )}

          <img
            src={signedUrls[images[fullscreenIndex]]}
            alt={`Billede ${fullscreenIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {images.length > 1 && (
            <p className="text-white/60 text-sm mt-3">
              {fullscreenIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  )
}
