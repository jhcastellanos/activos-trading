import 'dotenv/config'
import express from 'express'
import { authRouter } from './routes/auth'
import { schwabRouter } from './routes/schwab'

const app = express()

// Detrás del proxy de Vercel/Railway (para cookies secure).
app.set('trust proxy', 1)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/schwab', schwabRouter)

const port = Number(process.env.PORT) || 8080
app.listen(port, () => {
  console.log(`API de activos-trading escuchando en :${port}`)
})
