import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/widgets/layout/ui/app-layout'
import { CatalogPage } from '@/pages/catalog-page/ui/catalog-page'
import { ProductPage } from '@/pages/product-page/ui/product-page'
import { OrdersPage } from '@/pages/orders-page/ui/orders-page'
import { ManagerPage } from '@/pages/manager-page/ui/manager-page'
import { AdminPage } from '@/pages/admin-page/ui/admin-page'
import { NotFoundPage } from '@/pages/not-found-page/ui/not-found-page'
import { ProtectedRoute } from '@/features/auth/ui/protected-route'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <CatalogPage />,
      },
      {
        path: '/products/:id',
        element: <ProductPage />,
      },
      {
        element: <ProtectedRoute requiredRole="user" />,
        children: [
          {
            path: '/orders',
            element: <OrdersPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute requiredRole="manager" />,
        children: [
          {
            path: '/manager',
            element: <ManagerPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          {
            path: '/admin',
            element: <AdminPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export const AppRouter = () => <RouterProvider router={router} />
