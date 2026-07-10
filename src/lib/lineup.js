import { writable, get } from 'svelte/store'

const EMPTY = { order: [], batterIndex: 0, locked: false }

export function createLineup(storage) {
  const store = writable({ ...EMPTY })
  let key = null

  function set(state) {
    store.set(state)
    if (key) storage.setItem(key, JSON.stringify(state))
  }
  const update = (fn) => set(fn(get(store)))

  // everyone attends by default: first load seeds the order with the full roster
  function init(teamKey, roster = []) {
    key = `dj.lineup2.${teamKey}` // v2: attendance model (all present by default)
    const raw = storage.getItem(key)
    store.set(raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY, order: [...roster] })
  }

  function toggle(name) {
    update((s) => {
      const i = s.order.indexOf(name)
      if (i === -1) return { ...s, order: [...s.order, name] }
      const order = s.order.filter((n) => n !== name)
      let batterIndex = s.batterIndex
      if (i < batterIndex) batterIndex -= 1
      if (batterIndex >= order.length) batterIndex = 0
      return { order, batterIndex }
    })
  }

  function move(name, delta) {
    update((s) => {
      const i = s.order.indexOf(name)
      const j = i + delta
      if (i === -1 || j < 0 || j >= s.order.length) return s
      const order = [...s.order]
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...s, order }
    })
  }

  // drag-to-reorder: move `name` to the slot currently held by `targetName`
  function reorder(name, targetName) {
    update((s) => {
      const from = s.order.indexOf(name)
      const to = s.order.indexOf(targetName)
      if (from === -1 || to === -1 || from === to) return s
      const order = [...s.order]
      order.splice(from, 1)
      order.splice(to, 0, name)
      return { ...s, order }
    })
  }

  const setLocked = (locked) => update((s) => ({ ...s, locked }))

  const advance = () =>
    update((s) =>
      s.order.length ? { ...s, batterIndex: (s.batterIndex + 1) % s.order.length } : s
    )
  const back = () =>
    update((s) =>
      s.order.length
        ? { ...s, batterIndex: (s.batterIndex - 1 + s.order.length) % s.order.length }
        : s
    )
  const resetGame = () => update((s) => ({ ...s, batterIndex: 0 }))

  return { subscribe: store.subscribe, init, toggle, move, reorder, setLocked, advance, back, resetGame }
}

export const lineup = createLineup(
  typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {} }
)
