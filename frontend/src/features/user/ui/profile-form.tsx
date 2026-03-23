import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usersApi } from '@/shared/api/users-api'
import { useAuth } from '@/app/providers/auth-provider'

type ProfileFormProps = {
  onSuccess?: () => void
}

export const ProfileForm = ({ onSuccess }: ProfileFormProps) => {
  const { user, refreshMe } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    setFirstName(user.first_name)
    setLastName(user.last_name)
    setMiddleName(user.middle_name ?? '')
    setEmail(user.email)
  }, [user])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password || passwordRepeat) {
      if (password.length < 4) {
        setError('Новый пароль должен быть не короче 4 символов.')
        return
      }
      if (password !== passwordRepeat) {
        setError('Пароли не совпадают.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      await usersApi.updateMe({
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        email,
        password: password || undefined,
      })
      await refreshMe()
      setPassword('')
      setPasswordRepeat('')
      setMessage('Профиль обновлен.')
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить профиль.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <label className="stack">
        <span>Имя</span>
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required type="text" />
      </label>

      <label className="stack">
        <span>Фамилия</span>
        <input value={lastName} onChange={(event) => setLastName(event.target.value)} required type="text" />
      </label>

      <label className="stack">
        <span>Отчество (опционально)</span>
        <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} type="text" />
      </label>

      <label className="stack">
        <span>Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
      </label>

      <label className="stack">
        <span>Новый пароль</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          minLength={4}
          placeholder="Оставьте пустым, чтобы не менять"
        />
      </label>

      <label className="stack">
        <span>Повторите новый пароль</span>
        <input
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          type="password"
          minLength={4}
          placeholder="Повторите пароль"
        />
      </label>

      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}

      <button disabled={isSubmitting} type="submit" className="button-primary">
        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </form>
  )
}
