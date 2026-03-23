import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { lookupsApi } from '@/shared/api/lookups-api'
import type { LookupItem } from '@/shared/types/lookup'
import { productsApi } from '@/shared/api/products-api'
import type { Product } from '@/entities/product/model/types'
import { usersApi } from '@/shared/api/users-api'
import type { User } from '@/entities/user/model/types'
import type { Role } from '@/shared/types/role'

const lookupKinds = ['suppliers', 'manufacturers', 'categories', 'units', 'pickup-points'] as const

type LookupKind = (typeof lookupKinds)[number]

const lookupKindLabels: Record<LookupKind, string> = {
  suppliers: 'Поставщики',
  manufacturers: 'Производители',
  categories: 'Наименование товара (тип)',
  units: 'Единицы измерения',
  'pickup-points': 'Пункты выдачи',
}

type UserDraft = {
  first_name: string
  last_name: string
  middle_name?: string | null
  email: string
  role: Role
  password?: string
}

type ProductDraft = {
  name: string
  price: number
  discount: number
  stock_quantity: number
  description: string
}

const toUserDraft = (user: User): UserDraft => ({
  first_name: user.first_name,
  last_name: user.last_name,
  middle_name: user.middle_name ?? null,
  email: user.email,
  role: user.role,
  password: '',
})

const toProductDraft = (product: Product): ProductDraft => ({
  name: product.name,
  price: Number(product.price),
  discount: Number(product.discount ?? 0),
  stock_quantity: product.stock_quantity,
  description: product.description ?? '',
})

const emptyLookupDraft: LookupItem = { id: 0, created_at: '', updated_at: '', name: '' }

export const AdminPage = () => {
  const [view, setView] = useState<'lookups' | 'users' | 'products'>('lookups')
  const [lookupKind, setLookupKind] = useState<LookupKind>('categories')
  const [items, setItems] = useState<LookupItem[]>([])
  const [draft, setDraft] = useState<LookupItem>(emptyLookupDraft)
  const [editingLookupId, setEditingLookupId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({})
  const [productQuery, setProductQuery] = useState('')
  const [editPhotoFiles, setEditPhotoFiles] = useState<Record<number, File[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [userDrafts, setUserDrafts] = useState<Record<number, UserDraft>>({})
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [userQuery, setUserQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadLookup = () => {
    setError('')
    lookupsApi
      .list(lookupKind)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить справочник'))
  }

  useEffect(() => {
    loadLookup()
  }, [lookupKind])

  const loadProducts = async () => {
    setError('')
    try {
      const response = await productsApi.list()
      setProducts(response.items)
      const draftMap = response.items.reduce<Record<number, ProductDraft>>((acc, product) => {
        acc[product.id] = toProductDraft(product)
        return acc
      }, {})
      setProductDrafts(draftMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить товары')
    }
  }

  const loadUsers = async () => {
    setError('')
    try {
      const data = await usersApi.list()
      setUsers(data)
      const draftMap = data.reduce<Record<number, UserDraft>>((acc, user) => {
        acc[user.id] = toUserDraft(user)
        return acc
      }, {})
      setUserDrafts(draftMap)
      if (data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить пользователей')
    }
  }

  useEffect(() => {
    if (view === 'users') {
      void loadUsers()
    }
    if (view === 'products') {
      void loadProducts()
    }
  }, [view])

  const createOrUpdateLookupItem = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (lookupKind !== 'pickup-points' && !draft.name?.trim()) {
      setError('Введите название элемента справочника.')
      return
    }

    if (lookupKind === 'pickup-points' && (!draft.city || !draft.street || !draft.house_number || !draft.postal_code)) {
      setError('Для пункта выдачи заполните все поля адреса.')
      return
    }

    try {
      if (editingLookupId) {
        await lookupsApi.update(lookupKind, editingLookupId, draft)
        setMessage(`Элемент #${editingLookupId} обновлен.`)
      } else {
        await lookupsApi.create(lookupKind, draft)
        setMessage('Элемент справочника добавлен.')
      }
      setDraft(emptyLookupDraft)
      setEditingLookupId(null)
      loadLookup()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить элемент')
    }
  }

  const startEditLookupItem = (item: LookupItem) => {
    setEditingLookupId(item.id)
    setDraft({ ...item })
    setMessage('')
    setError('')
  }

  const cancelLookupEditing = () => {
    setEditingLookupId(null)
    setDraft(emptyLookupDraft)
  }

  const removeLookupItem = async (id: number) => {
    if (!window.confirm('Удалить элемент справочника?')) {
      return
    }
    setError('')
    setMessage('')
    try {
      await lookupsApi.remove(lookupKind, id)
      if (editingLookupId === id) {
        cancelLookupEditing()
      }
      setMessage('Элемент справочника удален.')
      loadLookup()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить элемент')
    }
  }

  const saveProduct = async (id: number) => {
    const row = productDrafts[id]
    if (!row) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.update(id, {
        name: row.name,
        price: row.price,
        discount: row.discount,
        stock_quantity: row.stock_quantity,
        description: row.description,
      })

      setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)))
      setProductDrafts((prev) => ({ ...prev, [id]: toProductDraft(updated) }))
      setMessage(`Товар #${id} обновлен.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить товар')
    }
  }

  const removeProduct = async (id: number) => {
    if (!window.confirm('Удалить товар из каталога?')) {
      return
    }

    setError('')
    setMessage('')
    try {
      await productsApi.remove(id)
      setProducts((prev) => prev.filter((product) => product.id !== id))
      setProductDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setMessage('Товар удален.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить товар')
    }
  }

  const uploadEditPhotos = async (id: number) => {
    const files = editPhotoFiles[id] ?? []
    if (files.length === 0) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.uploadPhotos(id, files)
      setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)))
      setEditPhotoFiles((prev) => ({ ...prev, [id]: [] }))
      setMessage(`Фотографии товара #${id} обновлены.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить фотографии товара')
    }
  }

  const deleteProductPhoto = async (productId: number, photoId: number) => {
    if (!window.confirm('Удалить фотографию товара?')) {
      return
    }

    setError('')
    setMessage('')
    try {
      const updated = await productsApi.removePhoto(productId, photoId)
      setProducts((prev) => prev.map((product) => (product.id === productId ? updated : product)))
      setMessage(`Фотография товара #${productId} удалена.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить фотографию товара')
    }
  }

  const saveUser = async (id: number) => {
    const row = userDrafts[id]
    if (!row) {
      return
    }

    if (row.role === 'manager' && row.password && row.password.length < 4) {
      setError('Пароль менеджера должен быть не короче 4 символов.')
      return
    }

    const payload = {
      first_name: row.first_name,
      last_name: row.last_name,
      middle_name: row.middle_name,
      email: row.email,
      role: row.role,
      password: row.role === 'manager' && row.password ? row.password : undefined,
    }

    setError('')
    setMessage('')
    try {
      const updated = await usersApi.updateById(id, payload)
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)))
      setUserDrafts((prev) => ({ ...prev, [id]: toUserDraft(updated) }))
      setMessage(`Пользователь #${id} обновлен.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить пользователя')
    }
  }

  const removeUser = async (id: number) => {
    const user = users.find((item) => item.id === id)
    if (!user) {
      return
    }
    if (!window.confirm(`Удалить пользователя ${user.email}?`)) {
      return
    }
    setError('')
    try {
      await usersApi.removeById(id)
      setUsers((prev) => prev.filter((item) => item.id !== id))
      setUserDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (selectedUserId === id) {
        setSelectedUserId('')
      }
      setMessage('Пользователь удален.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить пользователя')
    }
  }

  const visibleUsers = users.filter((user) => {
    const text = `${user.email} ${user.last_name} ${user.first_name} ${user.middle_name ?? ''}`.toLowerCase()
    return text.includes(userQuery.trim().toLowerCase())
  })

  const visibleItems = items.filter((item) => {
    const text =
      item.name ??
      `${item.city ?? ''} ${item.street ?? ''} ${item.house_number ?? ''}`
    return text.toLowerCase().includes(query.trim().toLowerCase())
  })

  const visibleProducts = products.filter((product) => {
    const text = `${product.article} ${product.name}`.toLowerCase()
    return text.includes(productQuery.trim().toLowerCase())
  })

  return (
    <section className="stack">
      <article className="card stack">
        <h1>Панель администратора</h1>
        <p className="muted">
          Управление справочниками и ролями пользователей. Изменения применяются сразу.
        </p>
        <div className="row">
          <button
            className={view === 'lookups' ? 'button-primary' : 'button-secondary'}
            onClick={() => setView('lookups')}
          >
            Справочники
          </button>
          <button
            className={view === 'products' ? 'button-primary' : 'button-secondary'}
            onClick={() => setView('products')}
          >
            Товары
          </button>
          <button
            className={view === 'users' ? 'button-primary' : 'button-secondary'}
            onClick={() => setView('users')}
          >
            Пользователи
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
      </article>

      {view === 'lookups' && (
        <article className="card stack">
          <h2>Справочники</h2>
          <div className="panel-toolbar">
            <label className="stack field">
              <span>Тип справочника</span>
              <select value={lookupKind} onChange={(e) => setLookupKind(e.target.value as LookupKind)}>
                {lookupKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {lookupKindLabels[kind]}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack field">
              <span>Поиск в справочнике</span>
              <input
                placeholder="Название или адрес"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <form onSubmit={createOrUpdateLookupItem} className="manager-grid">
            {lookupKind === 'pickup-points' ? (
              <>
                <label className="stack field">
                  <span>Почтовый индекс</span>
                  <input
                    value={draft.postal_code ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, postal_code: e.target.value }))}
                    required
                  />
                </label>
                <label className="stack field">
                  <span>Город</span>
                  <input
                    value={draft.city ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </label>
                <label className="stack field">
                  <span>Улица</span>
                  <input
                    value={draft.street ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, street: e.target.value }))}
                    required
                  />
                </label>
                <label className="stack field">
                  <span>Номер дома</span>
                  <input
                    value={draft.house_number ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, house_number: e.target.value }))}
                    required
                  />
                </label>
              </>
            ) : (
              <>
                <label className="stack field">
                  <span>Название</span>
                  <input
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>
                {lookupKind === 'manufacturers' && (
                  <label className="stack field">
                    <span>Страна</span>
                    <input
                      value={draft.country ?? ''}
                      onChange={(e) => setDraft((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </label>
                )}
                {lookupKind === 'suppliers' && (
                  <>
                    <label className="stack field">
                      <span>Телефон</span>
                      <input
                        value={draft.phone ?? ''}
                        onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </label>
                    <label className="stack field">
                      <span>Email</span>
                      <input
                        value={draft.email ?? ''}
                        onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </label>
                  </>
                )}
              </>
            )}
            <button className="button-primary" type="submit">
              {editingLookupId ? 'Сохранить изменения' : 'Добавить'}
            </button>
            {editingLookupId && (
              <button className="button-secondary" type="button" onClick={cancelLookupEditing}>
                Отменить редактирование
              </button>
            )}
          </form>

          {visibleItems.map((item) => (
            <div className="entity-row" key={item.id}>
              <div className="entity-main">
                <strong>{item.name ?? `${item.city}, ${item.street} ${item.house_number}`}</strong>
                <span className="muted">ID: {item.id}</span>
              </div>
              <div className="row">
                <button className="button-secondary" onClick={() => startEditLookupItem(item)}>
                  Редактировать
                </button>
                <button className="button-secondary danger-button" onClick={() => void removeLookupItem(item.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
          {visibleItems.length === 0 && <p className="muted">По запросу ничего не найдено.</p>}
        </article>
      )}

      {view === 'products' && (
        <article className="card stack">
          <h2>Товары</h2>
          <p className="muted">Редактируйте параметры товара прямо в списке.</p>
          <label className="stack field">
            <span>Поиск товара</span>
            <input
              placeholder="Артикул или наименование"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
            />
          </label>

          <div className="users-table-wrapper">
            <div className="users-table-header users-table-row">
              <span>Артикул</span>
              <span>Наименование</span>
              <span>Цена</span>
              <span>Скидка %</span>
              <span>Остаток</span>
              <span>Описание</span>
              <span>Фото</span>
              <span>Действия</span>
            </div>

            {visibleProducts.map((product) => {
              const row = productDrafts[product.id]
              if (!row) {
                return null
              }

              return (
                <div key={product.id} className="users-table-row">
                  <span>{product.article}</span>
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setProductDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], name: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.price}
                    onChange={(e) =>
                      setProductDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], price: Number(e.target.value) } }))
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={row.discount}
                    onChange={(e) =>
                      setProductDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], discount: Number(e.target.value) } }))
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    value={row.stock_quantity}
                    onChange={(e) =>
                      setProductDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], stock_quantity: Number(e.target.value) } }))
                    }
                  />
                  <input
                    value={row.description}
                    onChange={(e) =>
                      setProductDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], description: e.target.value } }))
                    }
                  />
                  <div className="stack">
                    <span className="muted">Всего: {product.photos.length}</span>
                    {product.photos.map((photo) => (
                      <div key={photo.id} className="row">
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/products/photo/${photo.filename}`}
                          alt={`Фото ${product.name}`}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <span className="muted">#{photo.id}</span>
                        <button className="button-secondary danger-button" onClick={() => deleteProductPhoto(product.id, photo.id)}>
                          Удалить фото
                        </button>
                      </div>
                    ))}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setEditPhotoFiles((prev) => ({ ...prev, [product.id]: Array.from(e.target.files ?? []) }))
                      }
                    />
                    <button className="button-secondary" onClick={() => uploadEditPhotos(product.id)}>
                      Добавить фото
                    </button>
                  </div>
                  <div className="row">
                    <button className="button-primary" onClick={() => saveProduct(product.id)}>
                      Сохранить
                    </button>
                    <button className="button-secondary danger-button" onClick={() => removeProduct(product.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {visibleProducts.length === 0 && <p className="muted">Товары не найдены.</p>}
        </article>
      )}

      {view === 'users' && (
        <article className="card stack">
          <h2>Пользователи</h2>
          <p className="muted">Выберите пользователя через селект и редактируйте данные прямо в таблице.</p>
          <div className="panel-toolbar">
            <label className="stack field">
              <span>Поиск пользователя</span>
              <input
                placeholder="Email или ФИО"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </label>
            <label className="stack field">
              <span>Выбор пользователя</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Не выбрано</option>
                {visibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    #{user.id} {user.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="users-table-wrapper">
            <div className="users-table-header users-table-row">
              <span>ID</span>
              <span>Имя</span>
              <span>Фамилия</span>
              <span>Отчество</span>
              <span>Email</span>
              <span>Роль</span>
              <span>Новый пароль</span>
              <span>Действия</span>
            </div>

            {visibleUsers.map((user) => {
              const row = userDrafts[user.id]
              if (!row) {
                return null
              }
              const isSelected = selectedUserId === user.id
              return (
                <div key={user.id} className={`users-table-row ${isSelected ? 'users-row-selected' : ''}`}>
                  <span>#{user.id}</span>
                  <input
                    value={row.first_name}
                    onChange={(e) =>
                      setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], first_name: e.target.value } }))
                    }
                  />
                  <input
                    value={row.last_name}
                    onChange={(e) =>
                      setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], last_name: e.target.value } }))
                    }
                  />
                  <input
                    value={row.middle_name ?? ''}
                    onChange={(e) =>
                      setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], middle_name: e.target.value || null } }))
                    }
                  />
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) =>
                      setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], email: e.target.value } }))
                    }
                  />
                  <select
                    value={row.role}
                    onChange={(e) =>
                      setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], role: e.target.value as Role } }))
                    }
                  >
                    <option value="user">user</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                  {row.role === 'manager' ? (
                    <input
                      type="password"
                      placeholder="Введите новый пароль"
                      value={row.password ?? ''}
                      onChange={(e) =>
                        setUserDrafts((prev) => ({ ...prev, [user.id]: { ...prev[user.id], password: e.target.value } }))
                      }
                    />
                  ) : (
                    <span className="muted">Только для manager</span>
                  )}
                  <div className="row">
                    <button className="button-primary" onClick={() => saveUser(user.id)}>
                      Сохранить
                    </button>
                    <button className="button-secondary danger-button" onClick={() => removeUser(user.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {visibleUsers.length === 0 && <p className="muted">Пользователи не найдены.</p>}
        </article>
      )}
    </section>
  )
}
