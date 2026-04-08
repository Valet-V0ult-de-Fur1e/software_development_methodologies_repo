# software_development_methodologies_repo

Репозиторий для практических работ по МРПО. В проекте есть backend на FastAPI, frontend на React + TypeScript + Vite, PostgreSQL для данных и MinIO для хранения изображений.

## Что входит в проект

- Backend API для каталога, пользователей, заказов и справочников.
- Frontend-приложение для работы с каталогом и личным кабинетом.
- PostgreSQL как основная база данных.
- MinIO как объектное хранилище для фотографий товаров.
- Docker Compose для запуска всего стека одной командой.

## Быстрый запуск через Docker Compose

Перед запуском убедитесь, что установлен Docker Desktop или совместимый Docker Engine с Docker Compose.

1. Откройте терминал и перейдите в каталог `docker`.

```bash
cd docker
```

2. Запустите сборку и подъем контейнеров.

```bash
docker compose up --build
```

3. Дождитесь, пока поднимутся все сервисы. На первом старте Docker соберет backend и frontend, создаст тома и выполнит миграции.

4. Откройте нужные адреса в браузере.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger/OpenAPI: http://localhost:8000/docs
- MinIO Console: http://localhost:9001
- MinIO API: http://localhost:9000

5. Для остановки используйте `Ctrl + C`, затем при необходимости выполните:

```bash
docker compose down
```

### Что поднимается при старте

- `db` - PostgreSQL 15 с базой `shoe_store`.
- `minio` - хранилище объектов для изображений.
- `minio-init` - инициализация bucket `shoe-store-images` и открытого доступа на скачивание.
- `migrate` - применение миграций Alembic.
- `backend` - FastAPI приложение.
- `frontend` - Nginx-контейнер со статической сборкой фронтенда.

## Локальный запуск без Docker

Если нужно запускать части проекта отдельно, используйте этот сценарий.

### Backend

1. Перейдите в папку backend.

```bash
cd backend
```

2. Создайте и активируйте виртуальное окружение.

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Установите зависимости.

```bash
pip install -r requirements.txt
```

4. Проверьте файл `.env` в папке backend. Для работы backend нужны как минимум такие переменные:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `SSRF_BLOCKED_HOSTS`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET_NAME`

5. Примените миграции.

```bash
alembic upgrade head
```

6. Запустите сервер.

```bash
uvicorn app.main:app --reload
```

После старта backend будет доступен по адресу http://localhost:8000, а документация FastAPI - по адресу http://localhost:8000/docs.

### Frontend

1. Перейдите в папку frontend.

```bash
cd frontend
```

2. Установите зависимости.

```bash
npm ci
```

3. При необходимости задайте адрес backend через `VITE_API_BASE_URL`. В Docker Compose по умолчанию используется `http://localhost:8000/api/v1`.

4. Запустите dev-сервер.

```bash
npm run dev
```

После запуска frontend доступен по адресу, который покажет Vite, обычно http://localhost:5173.

## Структура репозитория

### `backend/`

Backend организован по слоям: маршруты, сервисы, репозитории, схемы и ORM-модели.

- `app/main.py` - точка входа FastAPI, подключение CORS, маршрутов и создание таблиц в режиме разработки.
- `app/api/v1/` - REST-маршруты по версиям API.
- `app/core/` - конфигурация, безопасность, JWT, S3-клиент и зависимости.
- `app/models/` - SQLAlchemy-модели и связи между таблицами.
- `app/repositories/` - слой доступа к данным.
- `app/schemas/` - Pydantic-схемы запросов и ответов.
- `app/services/` - бизнес-логика.
- `alembic/` - миграции базы данных.
- `requirements.txt` - список Python-зависимостей.

### `frontend/`

Frontend построен на Vite и React.

- `src/app/` - инициализация приложения, провайдеры, роутер и глобальные стили.
- `src/pages/` - страницы приложения.
- `src/widgets/` - крупные UI-блоки.
- `src/features/` - прикладные фичи, например авторизация и корзина.
- `src/entities/` - доменные сущности и их модели.
- `src/shared/` - общие типы, API-клиент и утилиты.
- `public/` - статические файлы.

### `docker/`

- `docker-compose.yml` - сборка полного окружения: PostgreSQL, MinIO, backend, frontend и миграции.

## База данных

В проекте используется PostgreSQL 15. База данных в Docker Compose создается с именем `shoe_store`, пользователь по умолчанию - `user`, пароль - `password`.

Во всех основных таблицах используется общий mixin с полями:

- `created_at` - дата и время создания записи.
- `updated_at` - дата и время последнего обновления записи.

### Таблицы

#### `users`

Хранит пользователей системы.

- `id` - первичный ключ.
- `role` - роль пользователя (`guest`, `user`, `manager`, `admin`).
- `first_name`, `last_name`, `middle_name` - ФИО.
- `email` - уникальный email.
- `password_hash` - хеш пароля.

Связь: один пользователь может иметь много заказов.

#### `manufacturers`

Производители товаров.

- `name` - название производителя.
- `country` - страна производства.

Связь: один производитель связан со многими товарами.

#### `suppliers`

Поставщики товаров.

- `name` - название поставщика.
- `phone` - телефон.
- `email` - email.

Связь: один поставщик связан со многими товарами.

#### `product_categories`

Категории товаров.

- `name` - уникальное название категории.

Связь: одна категория связана со многими товарами.

#### `units_of_measurement`

Единицы измерения.

- `name` - уникальное название единицы измерения.

Связь: одна единица измерения связана со многими товарами.

#### `pickup_points`

Пункты выдачи заказов.

- `postal_code` - почтовый индекс.
- `city` - город.
- `street` - улица.
- `house_number` - номер дома.

Связь: один пункт выдачи может использоваться в нескольких заказах.

#### `products`

Карточка товара.

- `article` - уникальный артикул.
- `name` - название.
- `unit_id` - ссылка на `units_of_measurement`.
- `price` - цена.
- `supplier_id` - ссылка на `suppliers`.
- `manufacturer_id` - ссылка на `manufacturers`.
- `category_id` - ссылка на `product_categories`.
- `discount` - скидка.
- `stock_quantity` - остаток на складе.
- `description` - описание.

Связи: товар относится к одному поставщику, одному производителю, одной категории и одной единице измерения. У товара может быть несколько фотографий и несколько позиций в заказах.

#### `product_photos`

Фотографии товаров.

- `product_id` - ссылка на `products`.
- `filename` - имя файла в хранилище.

Связь: у одного товара может быть несколько фотографий.

#### `orders`

Заказы пользователей.

- `order_number` - уникальный номер заказа.
- `date_ordered` - дата оформления.
- `date_delivered` - дата доставки.
- `pickup_point_id` - ссылка на `pickup_points`.
- `user_id` - ссылка на `users`.
- `pickup_code` - код получения.
- `status` - статус заказа (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).

Связи: заказ принадлежит пользователю и пункту выдачи, а также содержит позиции заказа.

#### `order_items`

Позиции внутри заказа.

- `order_id` - ссылка на `orders`.
- `product_id` - ссылка на `products`.
- `quantity` - количество.
- `price_at_order` - цена на момент оформления.

Связь: одна запись связывает заказ и товар. Это таблица для связи многие-ко-многим с дополнительными атрибутами.

### Особенности модели заказов

- В `Order` есть вычисляемое свойство `total_price`, которое суммирует стоимость всех позиций.
- Код выдачи хранится в поле `pickup_code` и имеет формат из трех цифр.
- Статусы заказа фиксированы перечислением `OrderStatus`.

### Начальные данные

В миграциях есть сидирование администратора. Если таблица `users` уже существует, Alembic создает пользователя с email `admin@shoestore.local`.

## Полезные замечания

- Backend настроен на CORS для `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000` и `http://127.0.0.1:3000`.
- Frontend в Docker Compose собирается с базовым адресом API `http://localhost:8000/api/v1`.
- Для MinIO создается bucket `shoe-store-images`.

Если нужно, следующим сообщением могу добавить в README еще и пример `.env` для локального запуска.
