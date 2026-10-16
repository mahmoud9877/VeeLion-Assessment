const HttpError = require('../../../utils/httpError');
const BodyValidator = require('../../../utils/bodyValidator');

class TasksValidator extends BodyValidator {
  constructor() {
    super(['title', 'completed']);
  }

  validateCreate(payload) {
    this.assertValidShape(payload);

    const normalized = this.#normalize(payload);

    if (!Object.hasOwn(normalized, 'title')) {
      throw new HttpError(400, '"title" is required.');
    }

    if (!Object.hasOwn(normalized, 'completed')) {
      normalized.completed = false;
    }

    return normalized;
  }

  validateUpdate(payload) {
    this.assertValidShape(payload);

    const normalized = this.#normalize(payload);

    if (Object.keys(normalized).length === 0) {
      throw new HttpError(400, 'Provide at least one updatable field.');
    }

    return normalized;
  }

  #normalize(payload) {
    const normalized = {};

    if (Object.hasOwn(payload, 'title')) {
      if (typeof payload.title !== 'string') {
        throw new HttpError(400, '"title" must be a string.');
      }

      const trimmedTitle = payload.title.trim();
      if (!trimmedTitle) {
        throw new HttpError(400, '"title" cannot be empty.');
      }

      normalized.title = trimmedTitle;
    }

    if (Object.hasOwn(payload, 'completed')) {
      if (typeof payload.completed !== 'boolean') {
        throw new HttpError(400, '"completed" must be a boolean.');
      }

      normalized.completed = payload.completed;
    }

    return normalized;
  }
}

module.exports = TasksValidator;
