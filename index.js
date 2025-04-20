const express = require('express');
const cors = require('cors'); // ✅ Add this line
const app = express();
const port = 5000;
const connectDB = require('./config/db');

// ✅ Enable CORS
app.use(cors());

app.use(express.json());

const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/card', cardRoutes);
app.use('/api/auth', authRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
