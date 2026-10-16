// Handlers are arrow-function fields so they keep `this` when passed to Express as callbacks.
class ReportsController {
  /** @param {import('../services/reports.service')} reportsService */
  constructor(reportsService) {
    this.reportsService = reportsService;
  }

  getTasksSummary = async (req, res) => {
    const summary = await this.reportsService.getTasksSummary();
    res.status(200).json(summary);
  };
}

module.exports = ReportsController;
