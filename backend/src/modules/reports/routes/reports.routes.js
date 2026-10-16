const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');

/** @param {import('../controllers/reports.controller')} reportsController */
function createReportsRouter(reportsController) {
  const reportsRouter = express.Router();

  reportsRouter.get('/tasks-summary', asyncHandler(reportsController.getTasksSummary));

  return reportsRouter;
}

module.exports = createReportsRouter;
