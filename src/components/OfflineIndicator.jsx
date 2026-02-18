import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => {
      // Vis kort "online igen" besked foer den forsvinder
      setTimeout(() => setOffline(false), 2000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="no-print fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-nordic-800 text-white px-5 py-3 rounded-2xl shadow-lg
                      flex items-center gap-2 text-sm font-medium max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
        </svg>
        Du arbejder offline &ndash; aendringer gemmes naar du er online igen
      </div>
    </div>
  )
}
