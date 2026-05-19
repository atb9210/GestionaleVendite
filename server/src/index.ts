import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
 
// Carica variabili d'ambiente
dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 3001;
 
// Middleware
app.use(cors());
app.use(express.json());
 
// Route di test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server funzionante!' });
});
 
// Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione su http://localhost:${PORT}`);
});