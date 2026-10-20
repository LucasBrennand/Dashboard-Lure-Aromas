import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// A primeira chamada pode acordar um backend gratuito que estava suspenso.
axios.defaults.timeout = 30000
axios.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  const status = error.response?.status
  const shouldRetry = config?.method === 'get'
    && !config._retryCount
    && (!status || status >= 500)

  if (shouldRetry) {
    config._retryCount = 1
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return axios(config)
  }
  return Promise.reject(error)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
