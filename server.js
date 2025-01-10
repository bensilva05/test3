const express = require('express');
const cors = require('cors'); // Importing the cors module
const mysql = require('mysql');

const server = express();

// Enable CORS for all origins
server.use(cors());

// Parsing JSON request bodies (no need for body-parser anymore)
server.use(express.json());

const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'task_manager_db' 
});

database.connect(err => {
    if (err) throw err;
    console.log("Database Connected");
});

// Get all tasks
server.get('/tasks', (req, res) => {
    database.query('SELECT * FROM tasks', (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json(results);
    });
});

// Create task
server.post('/tasks', (req, res) => {
    const { title, description } = req.body;
    const taskDescription = description || ""; // Default to empty string if undefined

    const createTask = 'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)';
    database.query(createTask, [title, taskDescription, false], (error, result) => {
        if (error) {
            console.error('Error inserting task:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        const newTask = { id: result.insertId, title, description: taskDescription, completed: false };
        res.json({ task: newTask });
    });
});

// Update task
server.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const updateTask = 'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?';
    database.query(updateTask, [title, description || "", completed, id], (error) => {
        if (error) return res.status(500).json({ error });
        res.json({ message: 'Task updated' });
    });
});

// Delete task
server.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const deleteTask = 'DELETE FROM tasks WHERE id = ?';
    database.query(deleteTask, [id], (error) => {
        if (error) return res.status(500).json({ error });
        res.json({ message: 'Task deleted' });
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
});
