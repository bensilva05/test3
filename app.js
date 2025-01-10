const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const noTasksMessage = document.querySelector(".no-tasks-message");

// Update the no-tasks message based on task count
function updateNoTasksMessage() {
    const taskCount = taskList.children.length;
    noTasksMessage.style.display = taskCount > 0 ? "none" : "block"; // Show/hide message
}

// Add task to UI
function addToTaskUI(task) {
    const row = document.createElement("tr");
    row.className = "task-item";

    // Check the task's completed status to update the UI
    const completedClass = task.completed ? 'completed' : '';
    const checked = task.completed ? 'checked' : '';

    row.innerHTML = `
        <td class="task-title ${completedClass}">${task.title}</td>
        <td class="task-description ${completedClass}">${task.description}</td>
        <td><input type="checkbox" class="task-checkbox" ${checked} onchange="toggleComplete(${task.id}, this)"></td>
        <td>
            <div class="action-buttons">
                <button class="edit-button" onclick="toggleEditTask(${task.id}, this, event)">Edit</button>
                <button class="delete-button" onclick="deleteTask(${task.id}, this)">Delete</button>
            </div>
        </td>
    `;

    taskList.appendChild(row);
    updateNoTasksMessage(); // Update the no-tasks message after adding a task
}

// Load tasks from database
function loadTasks() {
    fetch('http://localhost:3000/tasks')
        .then(response => response.json())
        .then(tasks => {
            tasks.sort((a, b) => a.title.localeCompare(b.title)); // Sort tasks alphabetically by title
            tasks.forEach(task => addToTaskUI(task));
            updateNoTasksMessage(); // Check if any tasks were loaded
        })
        .catch(error => console.error("Error loading tasks:", error));
}

// Load tasks when the page refreshes
window.onload = function() {
    loadTasks();
};

// Task submission
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const taskInput = document.getElementById("task-input");
    const descriptionInput = document.getElementById("description-input");
    const taskText = taskInput.value.trim();
    const descriptionText = descriptionInput.value.trim(); // Get the description

    if (taskText) {
        fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: taskText, description: descriptionText, completed: false }) // Send title, description, and completed state (false by default)
        })
        .then(response => {
            if (!response.ok) throw new Error("Unexpected response");
            return response.json();
        })
        .then(data => {
            addToTaskUI(data.task); // Add task to UI
            taskInput.value = "";
            descriptionInput.value = ""; // Clear description input
            sortTasksAlphabetically(); // Sort tasks alphabetically after adding new one
        })
        .catch(error => console.error("Error", error));
    } else {
        alert("Please enter a task");
    }
});

// Toggle complete state of a task
window.toggleComplete = function(taskId, checkbox) {
    const completed = checkbox.checked;

    // Get the task row and the description
    const row = checkbox.closest("tr");
    const titleCell = row.querySelector(".task-title");
    const descriptionCell = row.querySelector(".task-description");
    
    // Update the task on the server (backend)
    fetch(`http://localhost:3000/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: titleCell.innerText.trim(), // Send the title
            description: descriptionCell.innerText.trim(), // Send the description
            completed 
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to update task completion status");

        // Update UI after successful update
        if (completed) {
            titleCell.classList.add("completed");
            descriptionCell.classList.add("completed");
        } else {
            titleCell.classList.remove("completed");
            descriptionCell.classList.remove("completed");
        }
    })
    .catch(error => console.error("Error updating task completion status", error));
};

// Delete task
window.deleteTask = function(taskId, button) {
    const confirmation = confirm("Are you sure you want to delete this task?");

    if (confirmation) {
        fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to delete task");

            // Find the row to remove from the UI
            const row = button.closest("tr");
            taskList.removeChild(row);
            updateNoTasksMessage(); // Update the message after removing a task
            alert("Task successfully deleted!");
        })
        .catch(error => console.error("Error deleting task", error));
    }
};

// Toggle edit mode for a task
window.toggleEditTask = function(taskId, editButton, event) {
    event.stopPropagation(); // Prevent click from triggering the checkbox

    const row = editButton.closest("tr");
    const titleCell = row.querySelector(".task-title");
    const descriptionCell = row.querySelector(".task-description");
    const checkbox = row.querySelector(".task-checkbox");
    const deleteButton = row.querySelector(".delete-button"); // Select the delete button

    const allEditButtons = document.querySelectorAll(".edit-button");
    const allDeleteButtons = document.querySelectorAll(".delete-button");
    const allCheckboxes = document.querySelectorAll(".task-checkbox");

    if (editButton.innerText === "Edit") {
        titleCell.contentEditable = true;
        descriptionCell.contentEditable = true;
        titleCell.focus();

        // Disable all buttons and checkboxes in all tasks
        allEditButtons.forEach(button => button.disabled = true);
        allDeleteButtons.forEach(button => button.disabled = true);
        allCheckboxes.forEach(checkbox => checkbox.disabled = true);

        // Enable the current edit button
        editButton.disabled = false;
        editButton.innerText = "Save";
    } else {
        const updatedTitle = titleCell.innerText.trim(); // Get updated title
        const updatedDescription = descriptionCell.innerText.trim(); // Get updated description

        // Check for empty title to prevent losing tasks
        if (updatedTitle === "") {
            alert("Task title cannot be empty!");
            return;
        }

        fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: updatedTitle, description: updatedDescription, completed: checkbox.checked }) // Send updated title, description, and completed status
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to update task");

            titleCell.contentEditable = false;
            descriptionCell.contentEditable = false;

            // Re-enable all buttons and checkboxes in all tasks
            allEditButtons.forEach(button => button.disabled = false);
            allDeleteButtons.forEach(button => button.disabled = false);
            allCheckboxes.forEach(checkbox => checkbox.disabled = false);

            editButton.innerText = "Edit";
        })
        .catch(error => {
            console.error("Error updating task", error);
            alert("Failed to update task. Please try again.");
        });
    }
};



// Function to sort tasks alphabetically by title
function sortTasksAlphabetically() {
    const rows = Array.from(taskList.querySelectorAll("tr"));
    const sortedRows = rows.sort((a, b) => {
        const titleA = a.querySelector(".task-title").innerText.toLowerCase();
        const titleB = b.querySelector(".task-title").innerText.toLowerCase();
        return titleA.localeCompare(titleB);
    });
    // Clear existing rows and append sorted rows
    taskList.innerHTML = "";
    sortedRows.forEach(row => taskList.appendChild(row));
    updateNoTasksMessage(); // Update the no-tasks message
}
