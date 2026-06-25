import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import leadsRouter from './routes/leads'
import chatRouter from './routes/chat'
import { errorHandler } from './middleware/errorHandler'
import './queues/leadPipelineQueue'

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/leads', leadsRouter)
app.use('/api/chat',  chatRouter)

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
