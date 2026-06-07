import 'dotenv/config'
import express from 'express'
import connectDB from './config/db.js'
import clientRoutes from './routes/clientRoute.js'
import elevenlabsRoute from './routes/elevenLabsRoute.js'
const app = express()
const PORT = process.env.PORT || 3001

connectDB()

app.use(express.json())
app.use('/api/clients', clientRoutes)
app.use('/api/call', elevenlabsRoute)

app.get('/', (_req, res) => {
  res.send('')
})

app.listen(PORT)
