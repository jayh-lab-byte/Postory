const DB_NAME = 'postory'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadProjects() {
  const db = await openDb()
  const tx = db.transaction('projects', 'readonly')
  const items = await requestToPromise(tx.objectStore('projects').getAll())
  return items.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveProject(project) {
  const db = await openDb()
  const tx = db.transaction('projects', 'readwrite')
  await requestToPromise(tx.objectStore('projects').put(project))
}

export async function removeProject(id) {
  const db = await openDb()
  const tx = db.transaction('projects', 'readwrite')
  await requestToPromise(tx.objectStore('projects').delete(id))
}

export async function loadProfile() {
  const db = await openDb()
  const tx = db.transaction('meta', 'readonly')
  const profile = await requestToPromise(tx.objectStore('meta').get('profile'))
  return (
    profile || {
      id: 'profile',
      name: '',
      bio: '',
      tone: '',
    }
  )
}

export async function saveProfile(profile) {
  const db = await openDb()
  const tx = db.transaction('meta', 'readwrite')
  await requestToPromise(tx.objectStore('meta').put({ ...profile, id: 'profile' }))
}
