const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const activityLogger = (entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (req.user && !res.statusCode.toString().startsWith('4') && !res.statusCode.toString().startsWith('5')) {
        const actionMap = {
          POST: 'CREATE',
          PUT: 'UPDATE',
          PATCH: 'UPDATE',
          DELETE: 'DELETE'
        };

        const action = actionMap[req.method];
        if (action) {
          prisma.activityLog.create({
            data: {
              businessId: req.userBusinessId || req.body.businessId,
              userId: req.user.id,
              action,
              entityType,
              entityId: body?.id || body?.data?.id || null,
              details: JSON.stringify({ method: req.method, path: req.path }),
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
          }).catch(() => {});
        }
      }

      return originalJson(body);
    };

    next();
  };
};

const validateBusinessExists = async (req, res, next) => {
  try {
    const { businessCode } = req.body;

    if (businessCode) {
      const business = await prisma.business.findUnique({
        where: { businessCode }
      });

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      if (!business.isActive) {
        return res.status(403).json({ error: 'Business is inactive' });
      }

      req.targetBusiness = business;
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Business validation failed' });
  }
};

const rateLimitByBusiness = (req, res, next) => {
  const businessId = req.userBusinessId || 'global';
  const key = `rate:${businessId}`;
  req.rateLimitKey = key;
  next();
};

module.exports = {
  activityLogger,
  validateBusinessExists,
  rateLimitByBusiness
};
