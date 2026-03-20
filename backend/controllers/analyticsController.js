const supabase = require('../config/supabaseClient');
const logger = require('../config/logger');

// Get admin dashboard analytics
const getAdminAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    console.log('Getting admin analytics using Supabase for period:', period);

    let analytics = {
      revenue: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisQuarter: 0,
        thisYear: 0
      },
      orders: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisQuarter: 0,
        thisYear: 0,
        pending: 0,
        completed: 0,
        cancelled: 0
      },
      users: {
        total: 0,
        farmers: 0,
        consumers: 0,
        admins: 0,
        verified: 0,
        newThisMonth: 0
      },
      products: {
        total: 0,
        available: 0,
        outOfStock: 0,
        featured: 0,
        newThisMonth: 0
      },
      farmers: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        newThisMonth: 0
      }
    };

    try {
      // Get total revenue and orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('totalamount, status, createdat');

      if (!ordersError && allOrders) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        allOrders.forEach(order => {
          const orderDate = new Date(order.createdat);
          const amount = parseFloat(order.totalamount) || 0;

          // Total revenue and orders
          analytics.revenue.total += amount;
          analytics.orders.total += 1;

          // Order status counts
          if (order.status === 'PENDING') analytics.orders.pending += 1;
          else if (order.status === 'COMPLETED') analytics.orders.completed += 1;
          else if (order.status === 'CANCELLED') analytics.orders.cancelled += 1;

          // Time-based revenue and orders
          if (orderDate >= todayStart) {
            analytics.revenue.today += amount;
            analytics.orders.today += 1;
          }
          if (orderDate >= weekStart) {
            analytics.revenue.thisWeek += amount;
            analytics.orders.thisWeek += 1;
          }
          if (orderDate >= monthStart) {
            analytics.revenue.thisMonth += amount;
            analytics.orders.thisMonth += 1;
          }
          if (orderDate >= quarterStart) {
            analytics.revenue.thisQuarter += amount;
            analytics.orders.thisQuarter += 1;
          }
          if (orderDate >= yearStart) {
            analytics.revenue.thisYear += amount;
            analytics.orders.thisYear += 1;
          }
        });
      }

      // Get users analytics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, isverified, createdat');

      if (!usersError && users) {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        users.forEach(user => {
          analytics.users.total += 1;
          
          if (user.role === 'farmer') analytics.users.farmers += 1;
          else if (user.role === 'consumer') analytics.users.consumers += 1;
          else if (user.role === 'admin') analytics.users.admins += 1;
          
          if (user.isverified) analytics.users.verified += 1;
          
          if (new Date(user.createdat) >= monthStart) {
            analytics.users.newThisMonth += 1;
          }
        });
      }

      // Get products analytics
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('isavailable, isfeatured, createdat');

      if (!productsError && products) {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        products.forEach(product => {
          analytics.products.total += 1;
          
          if (product.isavailable) analytics.products.available += 1;
          else analytics.products.outOfStock += 1;
          
          if (product.isfeatured) analytics.products.featured += 1;
          
          if (new Date(product.createdat) >= monthStart) {
            analytics.products.newThisMonth += 1;
          }
        });
      }

      // Get farmers analytics
      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('verificationstatus, createdat');

      if (!farmersError && farmers) {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        farmers.forEach(farmer => {
          analytics.farmers.total += 1;
          
          if (farmer.verificationstatus === 'approved') analytics.farmers.approved += 1;
          else if (farmer.verificationstatus === 'pending') analytics.farmers.pending += 1;
          else if (farmer.verificationstatus === 'rejected') analytics.farmers.rejected += 1;
          
          if (new Date(farmer.createdat) >= monthStart) {
            analytics.farmers.newThisMonth += 1;
          }
        });
      }

      console.log('Analytics calculated:', analytics);

      res.json({
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully'
      });

    } catch (dbError) {
      console.error('Database error in analytics:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Error getting admin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAdminAnalytics
};
