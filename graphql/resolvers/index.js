const authResolver = require('./auth');
const designsResolver = require('./designes');
const bookingResolver = require('./community');

const rootResolver = {
  ...authResolver,
  ...designsResolver,
  ...bookingResolver
};

module.exports = rootResolver;