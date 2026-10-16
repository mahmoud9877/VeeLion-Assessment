class ReportsService {
  /**
   * @param {import('../../../utils/jsonFileStore')} tasksStore
   * @param {import('../../../utils/jsonFileStore')} activitiesStore
   */
  constructor(tasksStore, activitiesStore) {
    this.tasksStore = tasksStore;
    this.activitiesStore = activitiesStore;
  }

  async getTasksSummary() {
    const [tasks, activities] = await Promise.all([
      this.tasksStore.readAll(),
      this.activitiesStore.readAll(),
    ]);

    const done = tasks.filter((task) => task.completed).length;

    return {
      total: tasks.length,
      byStatus: {
        todo: tasks.length - done,
        'in-progress': 0,
        done,
      },
      recentActivityCount: activities.length,
    };
  }
}

module.exports = ReportsService;
