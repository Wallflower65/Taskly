const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../authMiddleware');

router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const creatorId = req.user.userId;

    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const workspaceResult = await db.query(
      'INSERT INTO workspaces (name, creator_id) VALUES ($1, $2) RETURNING *',
      [name, creatorId]
    );
    const newWorkspace = workspaceResult.rows[0];

    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [newWorkspace.id, creatorId, 'admin']
    );

    res.status(201).json(newWorkspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build workspace' });
  }
});

router.post('/:id/invite', async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { email } = req.body;

    const userLookUp = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userLookUp.rows.length === 0) {
      return res.status(404).json({ error: 'No user registered with this email address' });
    }
    const targetUserId = userLookUp.rows[0].id;

    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [workspaceId, targetUserId]
    );

    res.json({ message: 'Team member added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Invitation system failure' });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query(
      'SELECT w.id, w.name FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team spaces' });
  }
});

module.exports = router;