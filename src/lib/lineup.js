import { writable, get } from 'svelte/store'

export function createLineup(storage) {
  const store = writable({ order: [], batterIndex: 0 })
  let key = null

  function set(state) {
    store.set(state)
    if (key) storage.setItem(key, JSON.stringify(state))
  }
  const update = (fn) => set(fn(get(store)))

  function init(teamKey) {
    key = `dj.lineup.${teamKey}`
    const raw = storage.getItem(key)
    store.set(raw ? JSON.parse(raw) : { order: [], batterIndex: 0 })
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

  return { subscribe: store.subscribe, init, toggle, move, advance, back, resetGame }
}

export const lineup = createLineup(
  typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {} }
)
