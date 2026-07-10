import { writable, get } from 'svelte/store'

// order always holds the FULL roster (drag to arrange); absence is a separate
// flag so unchecked kids keep their slot on screen instead of jumping around.
const EMPTY = { order: [], absent: [], batterIndex: 0, locked: false }

export function presentNames(state) {
  return state.order.filter((n) => !state.absent.includes(n))
}

export function createLineup(storage) {
  const store = writable({ ...EMPTY })
  let key = null

  function set(state) {
    store.set(state)
    if (key) storage.setItem(key, JSON.stringify(state))
  }
  const update = (fn) => set(fn(get(store)))

  const clamp = (s) => {
    const count = presentNames(s).length
    return s.batterIndex >= count ? { ...s, batterIndex: 0 } : s
  }

  // everyone attends by default: first load seeds the order with the full roster
  function init(teamKey, roster = []) {
    key = `dj.lineup3.${teamKey}` // v3: full-roster order + absent list
    const raw = storage.getItem(key)
    store.set(raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY, order: [...roster] })
  }

  // flip attendance in place — the kid keeps their slot in the order
  function toggle(name) {
    update((s) => {
      const absent = s.absent.includes(name)
        ? s.absent.filter((n) => n !== name)
        : [...s.absent, name]
      return clamp({ ...s, absent })
    })
  }

  const selectAll = () => update((s) => ({ ...s, absent: [] }))

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
    update((s) => {
      const count = presentNames(s).length
      return count ? { ...s, batterIndex: (s.batterIndex + 1) % count } : s
    })
  const back = () =>
    update((s) => {
      const count = presentNames(s).length
      return count ? { ...s, batterIndex: (s.batterIndex - 1 + count) % count } : s
    })
  const resetGame = () => update((s) => ({ ...s, batterIndex: 0 }))

  // jump straight to the i-th present batter (missed kid, catch-up, etc.)
  const jumpTo = (i) =>
    update((s) => {
      const count = presentNames(s).length
      if (!count || i < 0 || i >= count) return s
      return { ...s, batterIndex: i }
    })

  return { subscribe: store.subscribe, init, toggle, selectAll, reorder, setLocked, advance, back, resetGame, jumpTo }
}

export const lineup = createLineup(
  typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {} }
)
