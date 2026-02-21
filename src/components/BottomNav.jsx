export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', emoji: '🧶' },
    { id: 'inventory', label: 'Strikkelager', emoji: '📦' },
  ]

  return (
    <nav
      className="no-print fixed bottom-0 left-0 right-0 z-40
                 bg-white dark:bg-night-800
                 border-t border-warm-100 dark:border-night-600"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-colors
                         ${active
                           ? 'text-warm-600 dark:text-nordic-200'
                           : 'text-nordic-400 dark:text-nordic-500'}`}
            >
              {active && (
                <span className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-warm-500 dark:bg-nordic-400" />
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
