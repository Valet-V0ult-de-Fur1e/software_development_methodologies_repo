import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { lookupsApi } from '@/shared/api/lookups-api'
import type { LookupItem } from '@/shared/types/lookup'
import { usersApi } from '@/shared/api/users-api'
import type { User } from '@/entities/user/model/types'
import type { Role } from '@/shared/types/role'

const lookupKinds = ['suppliers', 'manufacturers', 'categories', 'units', 'pickup-points'] as const

type LookupKind = (typeof lookupKinds)[number]

export const AdminPage = () => {
  const [lookupKind, setLookupKind] = useState<LookupKind>('categories')
  const [items, setItems] = useState<LookupItem[]>([])
  const [draftName, setDraftName] = useState('')
  const [userId, setUserId] = useState<number | ''>('')
  const [loadedUser, setLoadedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')

  const loadLookup = () => {
    lookupsApi
      .list(lookupKind)
      .then(setItems)
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Не удалось загрузить справочник'))
  }

  useEffect(() => {
    loadLookup()
  }, [lookupKind])

  const createLookupItem = async (event: FormEvent) => {
    event.preventDefault()
    if (!draftName) {
      return
    }
    await lookupsApi.create(lookupKind, { name: draftName } as LookupItem)
    setDraftName('')
    loadLookup()
  }

  const loadUserById = async () => {
    if (!userId) {
      return
    }
    const user = await usersApi.getById(Number(userId))
    setLoadedUser(user)
  }

  const updateLoadedUserRole = async (role: Role) => {
    if (!loadedUser) {
      return
    }
    const updated = await usersApi.updateById(loadedUser.id, { role })
    setLoadedUser(updated)
    setMessage('Роль пользователя обновлена')
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h1>Панель администратора</h1>
        <p>Редактирование всех таблиц через API: справочники, товары/заказы (через manager), пользователи.</p>
      </article>

      <article className="card stack">
        <h2>Справочники</h2>
        <select value={lookupKind} onChange={(e) => setLookupKind(e.target.value as LookupKind)}>
          {lookupKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <form onSubmit={createLookupItem} className="row">
          <input
            placeholder="Название"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            required
          />
          <button className="button-primary" type="submit">
            Добавить
          </button>
        </form>
        {items.map((item) => (
          <div className="order-line" key={item.id}>
            <span>{item.name ?? `${item.city}, ${item.street}`}</span>
            <button className="button-secondary" onClick={() => lookupsApi.remove(lookupKind, item.id).then(loadLookup)}>
              Удалить
            </button>
          </div>
        ))}
      </article>

      <article className="card stack">
        <h2>Пользователи (таблица users)</h2>
        <div className="row">
          <input
            type="number"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
          />
          <button className="button-primary" onClick={loadUserById}>Загрузить</button>
        </div>
        {loadedUser && (
          <div className="stack">
            <p>{loadedUser.email}</p>
            <select value={loadedUser.role} onChange={(e) => updateLoadedUserRole(e.target.value as Role)}>
              <option value="user">user</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
            <button className="button-secondary" onClick={() => usersApi.removeById(loadedUser.id).then(() => setLoadedUser(null))}>
              Удалить пользователя
            </button>
          </div>
        )}
      </article>
      {message && <p>{message}</p>}
    </section>
  )
}
