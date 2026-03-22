import { AuthProvider } from '@/app/providers/auth-provider'
import { AppRouter } from '@/app/providers/router'
import { CartProvider } from '@/features/cart/model/cart-store'
import '@/app/styles/global.css'

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
