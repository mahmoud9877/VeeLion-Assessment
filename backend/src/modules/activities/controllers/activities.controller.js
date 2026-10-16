// Handlers are arrow-function fields so they keep `this` when passed to Express as callbacks.
class ActivitiesController {
  /** @param {import('../services/activities.service')} activitiesService */
  constructor(activitiesService) {
    this.activitiesService = activitiesService;
  }

  listActivities = async (req, res) => {
    const activities = await this.activitiesService.getAllActivities();
    res.status(200).json(activities);
  };

  createActivity = async (req, res) => {
    const activity = await this.activitiesService.createActivity(req.body);
    res.status(201).json(activity);
  };
}

module.exports = ActivitiesController;
