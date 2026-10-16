const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const validateBody = require('../../../middleware/validateBody');

/**
 * @param {import('../controllers/activities.controller')} activitiesController
 * @param {import('../validators/activities.validator')} activitiesValidator
 */
function createActivitiesRouter(activitiesController, activitiesValidator) {
  const activitiesRouter = express.Router();

  activitiesRouter.get('/', asyncHandler(activitiesController.listActivities));
  activitiesRouter.post(
    '/',
    validateBody((body) => activitiesValidator.validateCreate(body)),
    asyncHandler(activitiesController.createActivity)
  );

  return activitiesRouter;
}

module.exports = createActivitiesRouter;
