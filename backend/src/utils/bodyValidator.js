const HttpError = require('./httpError');

/** Base class for request-body validators: shape check + allow-list of fields. */
class BodyValidator {
  constructor(allowedFields) {
    this.allowedFields = allowedFields;
  }

  assertValidShape(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new HttpError(400, 'Body must be a JSON object.');
    }

    const unknownFields = Object.keys(payload).filter(
      (field) => !this.allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      throw new HttpError(400, 'Body contains unsupported fields.', {
        unsupportedFields: unknownFields,
      });
    }
  }
}

module.exports = BodyValidator;
