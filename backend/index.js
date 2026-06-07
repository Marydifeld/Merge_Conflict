import 'dotenv/config'
import express from 'express'
import connectDB from './config/db.js'
import clientRoutes from './routes/clientRoute.js'
import elevenlabsRoute from './routes/elevenLabsRoute.js'
const app = express()
const PORT = process.env.PORT || 3001

connectDB()

app.use(express.json())

// Native CORS middleware to support frontend local requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/api/clients', clientRoutes)
app.use('/api/call', elevenlabsRoute)

app.get('/', (_req, res) => {
  res.send('')
})

app.listen(PORT)
