const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const validateBody = require('../../../middleware/validateBody');

/**
 * @param {import('../controllers/tasks.controller')} tasksController
 * @param {import('../validators/tasks.validator')} tasksValidator
 */
function createTasksRouter(tasksController, tasksValidator) {
  const tasksRouter = express.Router();

  tasksRouter.get('/', asyncHandler(tasksController.listTasks));
  tasksRouter.get('/:id', asyncHandler(tasksController.getTask));
  tasksRouter.post(
    '/',
    validateBody((body) => tasksValidator.validateCreate(body)),
    asyncHandler(tasksController.createTask)
  );
  tasksRouter.patch(
    '/:id',
    validateBody((body) => tasksValidator.validateUpdate(body)),
    asyncHandler(tasksController.updateTask)
  );
  tasksRouter.delete('/:id', asyncHandler(tasksController.deleteTask));

  return tasksRouter;
}

module.exports = createTasksRouter;
