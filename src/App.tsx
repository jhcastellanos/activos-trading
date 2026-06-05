import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './app/providers/AppProvider'
import { ThemeProvider } from './app/providers/ThemeProvider'
import { AppRoutes } from './app/routes'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
