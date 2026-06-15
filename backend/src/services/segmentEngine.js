const Customer = require('../models/Customer');

/**
 * Converts a segment rule to a MongoDB query
 * @param {Object} rules 
 * @returns {Object} MongoDB query object
 */
function buildMongoQuery(rules) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return {};
  }

  const { operator, conditions } = rules;
  const mongoConditions = conditions.map(cond => {
    const { field, op, value } = cond;
    let mongoValue = value;

    // Handle special date values
    if (typeof value === 'string' && value.endsWith('_DAYS_AGO')) {
      const days = parseInt(value.split('_')[0]);
      if (!isNaN(days)) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        mongoValue = d;
      }
    }

    switch (op) {
      case 'gt': return { [field]: { $gt: mongoValue } };
      case 'gte': return { [field]: { $gte: mongoValue } };
      case 'lt': return { [field]: { $lt: mongoValue } };
      case 'lte': return { [field]: { $lte: mongoValue } };
      case 'eq': return { [field]: { $eq: mongoValue } };
      case 'contains': return { [field]: { $regex: mongoValue, $options: 'i' } };
      default: return {};
    }
  });

  if (mongoConditions.length === 1) {
    return mongoConditions[0];
  }

  return operator === 'OR' ? { $or: mongoConditions } : { $and: mongoConditions };
}

/**
 * Evaluates the rules against the Customer collection and returns the audience size
 * @param {Object} rules 
 * @returns {Promise<number>}
 */
async function evaluateAudienceSize(rules) {
  const query = buildMongoQuery(rules);
  return await Customer.countDocuments(query);
}

/**
 * Returns the matching customers for a given set of rules
 * @param {Object} rules 
 * @returns {Promise<Array>}
 */
async function getMatchingCustomers(rules) {
  const query = buildMongoQuery(rules);
  return await Customer.find(query);
}

module.exports = {
  buildMongoQuery,
  evaluateAudienceSize,
  getMatchingCustomers
};
