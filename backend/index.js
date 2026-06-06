import { createServer } from 'http'

const PORT = process.env.PORT || 3001

createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('')
}).listen(PORT)
