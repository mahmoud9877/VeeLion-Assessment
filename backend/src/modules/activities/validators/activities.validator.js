const HttpError = require('../../../utils/httpError');
const BodyValidator = require('../../../utils/bodyValidator');

class ActivitiesValidator extends BodyValidator {
  constructor() {
    super(['action', 'info']);
  }

  validateCreate(payload) {
    this.assertValidShape(payload);

    if (typeof payload.action !== 'string') {
      throw new HttpError(400, '"action" is required and must be a string.');
    }

    const action = payload.action.trim();
    if (!action) {
      throw new HttpError(400, '"action" cannot be empty.');
    }

    const normalized = { action };

    if (Object.hasOwn(payload, 'info')) {
      if (typeof payload.info !== 'string') {
        throw new HttpError(400, '"info" must be a string.');
      }

      normalized.info = payload.info.trim();
    }

    return normalized;
  }
}

module.exports = ActivitiesValidator;
