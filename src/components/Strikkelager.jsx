import YarnInventory from './YarnInventory'
import Needles from './Needles'
import Swatches from './Swatches'
import RecipeLibrary from './RecipeLibrary'
import StrikkeArkiv from './StrikkeArkiv'

const categories = [
  { id: 'yarn', label: 'Garnlager', emoji: '🧶', desc: 'Hold styr på dit garn' },
  { id: 'needles', label: 'Strikkepinde', emoji: '🥢', desc: 'Dine pinde og nåle' },
  { id: 'swatches', label: 'Strikkeprøver', emoji: '🔲', desc: 'Maskeprøver og fastheder' },
  { id: 'recipes', label: 'Opskrifter', emoji: '📄', desc: 'Dit PDF-bibliotek' },
  { id: 'archive', label: 'Færdigt strik', emoji: '✅', desc: 'Dine afsluttede strik' },
]

export default function Strikkelager({ userId, inventoryView, onViewChange }) {
  if (inventoryView === 'yarn') {
    return (
      <div>
        <BackButton onBack={() => onViewChange('home')} label="Strikkelager" />
        <YarnInventory userId={userId} />
      </div>
    )
  }

  if (inventoryView === 'needles') {
    return (
      <div>
        <BackButton onBack={() => onViewChange('home')} label="Strikkelager" />
        <Needles userId={userId} />
      </div>
    )
  }

  if (inventoryView === 'swatches') {
    return (
      <div>
        <BackButton onBack={() => onViewChange('home')} label="Strikkelager" />
        <Swatches userId={userId} />
      </div>
    )
  }

  if (inventoryView === 'recipes') {
    return <RecipeLibrary userId={userId} onBack={() => onViewChange('home')} />
  }

  if (inventoryView === 'archive') {
    return <StrikkeArkiv userId={userId} onBack={() => onViewChange('home')} />
  }

  // Home view
  return (
    <div>
      <h2 className="text-2xl font-bold text-nordic-800 dark:text-nordic-100 mb-6">Strikkelager</h2>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onViewChange(cat.id)}
            className="text-left bg-white dark:bg-night-700 rounded-2xl shadow-sm
                       border border-warm-100 dark:border-night-600
                       hover:shadow-md hover:border-warm-300 dark:hover:border-night-500
                       transition-all p-5"
          >
            <span className="text-3xl block mb-2">{cat.emoji}</span>
            <h3 className="font-semibold text-nordic-800 dark:text-nordic-100 text-base">{cat.label}</h3>
            <p className="text-xs text-nordic-400 dark:text-nordic-500 mt-0.5">{cat.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function BackButton({ onBack, label }) {
  return (
    <button
      onClick={onBack}
      className="text-nordic-500 hover:text-nordic-700 dark:text-nordic-400 dark:hover:text-nordic-200 mb-4 font-medium"
    >
      &larr; {label}
    </button>
  )
}
