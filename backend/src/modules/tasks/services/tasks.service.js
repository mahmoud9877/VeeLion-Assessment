const { createId } = require('../../../utils/id');
const HttpError = require('../../../utils/httpError');

class TasksService {
  /**
   * @param {import('../../../utils/jsonFileStore')} tasksStore
   * @param {import('../../activities/services/activities.service')} activitiesService
   */
  constructor(tasksStore, activitiesService) {
    this.tasksStore = tasksStore;
    this.activitiesService = activitiesService;
  }

  async getAllTasks() {
    return this.tasksStore.readAll();
  }

  async getTaskById(taskId) {
    const tasks = await this.tasksStore.readAll();
    return tasks[TasksService.#findTaskIndex(tasks, taskId)];
  }

  async createTask(payload) {
    const newTask = await this.tasksStore.update((tasks) => {
      const task = TasksService.#buildTaskRecord(payload);
      tasks.push(task);
      return task;
    });

    await this.#logActivities([{ action: 'Task created', info: newTask.title }]);
    return newTask;
  }

  async updateTask(taskId, updates) {
    const { previousTask, updatedTask } = await this.tasksStore.update((tasks) => {
      const taskIndex = TasksService.#findTaskIndex(tasks, taskId);
      const previous = tasks[taskIndex];
      const updated = {
        ...previous,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      tasks[taskIndex] = updated;
      return { previousTask: previous, updatedTask: updated };
    });

    await this.#logActivities(TasksService.#describeChanges(previousTask, updatedTask));
    return updatedTask;
  }

  async deleteTask(taskId) {
    const removedTask = await this.tasksStore.update((tasks) => {
      const [task] = tasks.splice(TasksService.#findTaskIndex(tasks, taskId), 1);
      return task;
    });

    await this.#logActivities([{ action: 'Task deleted', info: removedTask.title }]);
    return removedTask;
  }

  // Activity is a side effect: the task change is already saved, so a logging failure must not fail the request.
  async #logActivities(entries) {
    for (const entry of entries) {
      try {
        await this.activitiesService.createActivity(entry);
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }
  }

  static #buildTaskRecord(payload) {
    const now = new Date().toISOString();

    return {
      id: createId(),
      title: payload.title,
      completed: payload.completed,
      createdAt: now,
      updatedAt: now,
    };
  }

  static #findTaskIndex(tasks, taskId) {
    const taskIndex = tasks.findIndex((item) => item.id === taskId);

    if (taskIndex === -1) {
      throw new HttpError(404, 'Task not found.');
    }

    return taskIndex;
  }

  static #describeChanges(previousTask, updatedTask) {
    const changes = [];

    if (previousTask.title !== updatedTask.title) {
      changes.push({ action: 'Task renamed', info: `"${previousTask.title}" → "${updatedTask.title}"` });
    }

    if (previousTask.completed !== updatedTask.completed) {
      changes.push({
        action: updatedTask.completed ? 'Task completed' : 'Task reopened',
        info: updatedTask.title,
      });
    }

    return changes;
  }
}

module.exports = TasksService;
