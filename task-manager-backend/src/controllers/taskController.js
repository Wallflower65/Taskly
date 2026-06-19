const db = require('../db');

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.query;

    let queryText;
    let values;

    if (workspaceId) {
      queryText = `
        SELECT * FROM tasks 
        WHERE workspace_id = $1 
        ORDER BY created_at DESC
      `;
      values = [workspaceId];
    } else {
      queryText = `
        SELECT * FROM tasks 
        WHERE user_id = $1 AND workspace_id IS NULL 
        ORDER BY created_at DESC
      `;
      values = [userId];
    }

    const result = await db.query(queryText, values);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error while fetching tasks" });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, priority, due_date, category, workspace_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const queryText = `
      INSERT INTO tasks (user_id, title, description, priority, due_date, category, workspace_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      userId,
      title,
      description,
      priority || 'medium',
      due_date || null,
      category || 'General',
      workspace_id || null
    ];

    const result = await db.query(queryText, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error while creating task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, status, priority, due_date } = req.body;

    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.rows[0];

    if (task.workspace_id) {
      const memberCheck = await db.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [task.workspace_id, userId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Access denied. You are not a member of this workspace." });
      }
    } else {
      if (task.user_id !== userId) {
        return res.status(403).json({ error: "Access denied. You cannot modify personal tasks belonging to other accounts." });
      }
    }

    const queryText = `
      UPDATE tasks 
      SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const values = [title, description, status, priority, due_date, id];
    const result = await db.query(queryText, values);

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error while updating task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.rows[0];

    if (task.workspace_id) {
      const memberCheck = await db.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [task.workspace_id, userId]
      );

      if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only workspace admins can remove tasks from this board." });
      }
    } else {
      if (task.user_id !== userId) {
        return res.status(403).json({ error: "Access denied. You cannot remove personal tasks belonging to other accounts." });
      }
    }

    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return res.json({ message: "Task successfully removed from workspace", deletedTask: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error while deleting task" });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask
};