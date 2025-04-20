const express = require('express');
const app = express();
const port = 5000;
const connectDB = require('./config/db');

const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require("./routes/authRoutes");

app.use(express.json());
app.use('/api/card', cardRoutes);
app.use('/api/auth', authRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
