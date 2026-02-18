import { supabase } from './supabase'
import { getPendingChanges, removePendingChange } from './offlineDb'

let syncing = false

export async function syncPendingChanges() {
  if (syncing || !navigator.onLine) return
  syncing = true

  try {
    const changes = await getPendingChanges()

    // Grupper aendringer per projekt saa vi kun laver eet update per projekt
    const grouped = {}
    for (const change of changes) {
      if (!grouped[change.projectId]) {
        grouped[change.projectId] = { ids: [], updates: {} }
      }
      grouped[change.projectId].updates[change.field] = change.value
      grouped[change.projectId].ids.push(change.id)
    }

    for (const [projectId, { ids, updates }] of Object.entries(grouped)) {
      const { error } = await supabase
        .from('knitting_projects')
        .update(updates)
        .eq('id', projectId)

      if (!error) {
        for (const id of ids) {
          await removePendingChange(id)
        }
      }
    }
  } finally {
    syncing = false
  }
}

// Start lytning paa online-events
export function startOfflineSync() {
  window.addEventListener('online', syncPendingChanges)

  // Proev at synce hvert 30. sekund hvis online
  const interval = setInterval(() => {
    if (navigator.onLine) syncPendingChanges()
  }, 30000)

  // Sync med det samme hvis vi allerede er online
  if (navigator.onLine) syncPendingChanges()

  return () => {
    window.removeEventListener('online', syncPendingChanges)
    clearInterval(interval)
  }
}
