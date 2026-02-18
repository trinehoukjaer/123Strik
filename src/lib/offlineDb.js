const DB_NAME = 'strikkeapp-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending_changes'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Gem en aendring lokalt
export async function savePendingChange(projectId, field, value) {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  // Slet tidligere aendringer for samme projekt+felt saa vi kun har den nyeste
  const all = await new Promise((resolve) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
  })

  for (const item of all) {
    if (item.projectId === projectId && item.field === field) {
      store.delete(item.id)
    }
  }

  store.add({
    projectId,
    field,
    value,
    timestamp: Date.now(),
  })

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = reject
  })
  db.close()
}

// Hent alle ventende aendringer
export async function getPendingChanges() {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const result = await new Promise((resolve) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
  })
  db.close()
  return result
}

// Slet en aendring efter succesfuld sync
export async function removePendingChange(id) {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = reject
  })
  db.close()
}
