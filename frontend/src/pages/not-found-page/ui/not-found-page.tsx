import { Link } from 'react-router-dom'

export const NotFoundPage = () => {
  return (
    <section className="card stack">
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link className="button-link" to="/">
        Вернуться в каталог
      </Link>
    </section>
  )
}
