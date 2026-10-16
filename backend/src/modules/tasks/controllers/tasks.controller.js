// Handlers are arrow-function fields so they keep `this` when passed to Express as callbacks.
class TasksController {
  /** @param {import('../services/tasks.service')} tasksService */
  constructor(tasksService) {
    this.tasksService = tasksService;
  }

  listTasks = async (req, res) => {
    const tasks = await this.tasksService.getAllTasks();
    res.status(200).json({ data: tasks });
  };

  getTask = async (req, res) => {
    const task = await this.tasksService.getTaskById(req.params.id);
    res.status(200).json({ data: task });
  };

  createTask = async (req, res) => {
    const task = await this.tasksService.createTask(req.body);
    res.status(201).json({ data: task });
  };

  updateTask = async (req, res) => {
    const task = await this.tasksService.updateTask(req.params.id, req.body);
    res.status(200).json({ data: task });
  };

  deleteTask = async (req, res) => {
    await this.tasksService.deleteTask(req.params.id);
    res.status(204).send();
  };
}

module.exports = TasksController;
