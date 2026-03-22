import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/app/providers/auth-provider'

type AuthMode = 'login' | 'register'

type AuthWidgetProps = {
  defaultMode?: AuthMode
  onSuccess?: () => void
}

export const AuthWidget = ({ defaultMode = 'login', onSuccess }: AuthWidgetProps) => {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || null,
          email,
          password,
        })
      }
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка авторизации')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <button
          type="button"
          className={mode === 'login' ? 'button-primary' : 'button-secondary'}
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'button-primary' : 'button-secondary'}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        {mode === 'register' && (
          <>
            <label className="stack">
              <span>Имя</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                type="text"
              />
            </label>
            <label className="stack">
              <span>Фамилия</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                type="text"
              />
            </label>
            <label className="stack">
              <span>Отчество (опционально)</span>
              <input
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                type="text"
              />
            </label>
          </>
        )}

        <label className="stack">
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
          />
        </label>

        <label className="stack">
          <span>Пароль</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            minLength={4}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button disabled={isSubmitting} type="submit" className="button-primary">
          {isSubmitting
            ? mode === 'login'
              ? 'Вход...'
              : 'Регистрация...'
            : mode === 'login'
              ? 'Войти'
              : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  )
}
