const express = require('express');
const cors = require('cors');
const db = require('./db');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.get('/', (req, res) => res.json({ message: "Welcome to the Task Manager API!" }));
app.get('/test-db', async (req, res) => {
  const result = await db.query('SELECT NOW()');
  res.json({ status: "Database connected!", timestamp: result.rows[0].now });
});

app.listen(PORT, () => {
  console.log(`Server is running beautifully on port ${PORT}`);
});