const { createId } = require('../../../utils/id');

class ActivitiesService {
  /** @param {import('../../../utils/jsonFileStore')} activitiesStore */
  constructor(activitiesStore) {
    this.activitiesStore = activitiesStore;
  }

  async getAllActivities() {
    return this.activitiesStore.readAll();
  }

  async createActivity(payload) {
    return this.activitiesStore.update((activities) => {
      const activity = {
        id: createId(),
        action: payload.action,
        info: payload.info,
        when: new Date().toISOString(),
      };

      activities.push(activity);
      return activity;
    });
  }
}

module.exports = ActivitiesService;
