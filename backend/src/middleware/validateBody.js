function validateBody(validator) {
  return function validateBodyMiddleware(req, res, next) {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = validateBody;
