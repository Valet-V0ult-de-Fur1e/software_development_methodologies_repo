import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'

export const LoginForm = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось войти')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <label className="stack">
        <span>Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
      </label>
      <label className="stack">
        <span>Пароль</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          minLength={4}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={isSubmitting} type="submit" className="button-primary">
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}
