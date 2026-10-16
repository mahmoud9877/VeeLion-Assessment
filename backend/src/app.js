const path = require('node:path');
const express = require('express');

const JsonFileStore = require('./utils/jsonFileStore');
const HttpError = require('./utils/httpError');
const errorHandler = require('./middleware/errorHandler');

const ActivitiesService = require('./modules/activities/services/activities.service');
const ActivitiesController = require('./modules/activities/controllers/activities.controller');
const ActivitiesValidator = require('./modules/activities/validators/activities.validator');
const createActivitiesRouter = require('./modules/activities/routes/activities.routes');

const TasksService = require('./modules/tasks/services/tasks.service');
const TasksController = require('./modules/tasks/controllers/tasks.controller');
const TasksValidator = require('./modules/tasks/validators/tasks.validator');
const createTasksRouter = require('./modules/tasks/routes/tasks.routes');

const ReportsService = require('./modules/reports/services/reports.service');
const ReportsController = require('./modules/reports/controllers/reports.controller');
const createReportsRouter = require('./modules/reports/routes/reports.routes');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Composition root: builds every object once and wires the dependencies together.
 * `dataDir` can be overridden (e.g. a temp folder in tests).
 */
function createApp({ dataDir = DEFAULT_DATA_DIR } = {}) {
  const tasksStore = new JsonFileStore(path.join(dataDir, 'tasks.json'));
  const activitiesStore = new JsonFileStore(path.join(dataDir, 'activity.json'));

  const activitiesService = new ActivitiesService(activitiesStore);
  const tasksService = new TasksService(tasksStore, activitiesService);
  const reportsService = new ReportsService(tasksStore, activitiesStore);

  const app = express();

  app.use(express.json());

  app.use('/tasks', createTasksRouter(new TasksController(tasksService), new TasksValidator()));
  app.use(
    '/activity',
    createActivitiesRouter(new ActivitiesController(activitiesService), new ActivitiesValidator())
  );
  app.use('/reports', createReportsRouter(new ReportsController(reportsService)));

  app.use((req, res, next) => {
    next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
