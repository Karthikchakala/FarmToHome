// Customer controller for customer-specific operations

const { query } = require('../db')

const getDashboardData = async (req, res) => {
  try {
    console.log('Getting customer dashboard data...')
    
    const userId = req.user._id
    
    // Get customer dashboard statistics
    let dashboardData = {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalSpent: 0,
      monthlySpent: 0,
      savedAmount: 0,
      activeSubscriptions: 0,
      favoriteProducts: 0,
      recentOrders: [],
      favoriteFarmers: []
    }
    
    try {
      // Get order statistics
      const ordersResult = await query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status IN ('PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY') THEN 1 END) as active_orders,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status IN ('PLACED', 'CONFIRMED') THEN 1 END) as pending_orders,
          COALESCE(SUM(finalamount), 0) as total_spent
        FROM orders 
        WHERE consumerid = $1
      `, [userId])
      
      if (ordersResult.rows.length > 0) {
        const orderStats = ordersResult.rows[0]
        dashboardData.totalOrders = parseInt(orderStats.total_orders) || 0
        dashboardData.activeOrders = parseInt(orderStats.active_orders) || 0
        dashboardData.completedOrders = parseInt(orderStats.completed_orders) || 0
        dashboardData.pendingOrders = parseInt(orderStats.pending_orders) || 0
        dashboardData.totalSpent = parseFloat(orderStats.total_spent) || 0
      }
      
      console.log('Order stats:', dashboardData.totalOrders, 'orders')
    } catch (err) {
      console.error('Error getting order stats:', err.message)
    }
    
    try {
      // Get monthly spending
      const monthlyResult = await query(`
        SELECT COALESCE(SUM(finalamount), 0) as monthly_spent
        FROM orders 
        WHERE consumerid = $1 
        AND status = 'DELIVERED'
        AND createdat >= DATE_TRUNC('month', CURRENT_DATE)
      `, [userId])
      
      if (monthlyResult.rows.length > 0) {
        dashboardData.monthlySpent = parseFloat(monthlyResult.rows[0].monthly_spent) || 0
      }
      
      console.log('Monthly spending:', dashboardData.monthlySpent)
    } catch (err) {
      console.error('Error getting monthly spending:', err.message)
    }
    
    try {
      // Get active subscriptions
      const subscriptionsResult = await query(`
        SELECT COUNT(*) as active_subscriptions
        FROM subscriptions 
        WHERE customer_id = $1 AND status = 'active'
      `, [userId])
      
      if (subscriptionsResult.rows.length > 0) {
        dashboardData.activeSubscriptions = parseInt(subscriptionsResult.rows[0].active_subscriptions) || 0
      }
      
      console.log('Active subscriptions:', dashboardData.activeSubscriptions)
    } catch (err) {
      console.error('Error getting subscriptions:', err.message)
    }
    
    try {
      // Get recent orders
      const recentOrdersResult = await query(`
        SELECT o._id, o.totalamount, o.status, o.createdat, o.ordernumber,
               jsonb_array_length(o.items) as item_count
        FROM orders o
        WHERE o.consumerid = $1
        ORDER BY o.createdat DESC
        LIMIT 5
      `, [userId])
      
      dashboardData.recentOrders = recentOrdersResult.rows.map(order => ({
        id: order._id,
        orderNumber: order.ordernumber,
        amount: parseFloat(order.totalamount) || 0,
        status: order.status,
        date: new Date(order.createdat).toLocaleDateString(),
        items: parseInt(order.item_count) || 0
      }))
      
      console.log('Recent orders:', dashboardData.recentOrders.length, 'found')
    } catch (err) {
      console.error('Error getting recent orders:', err.message)
    }
    
    try {
      // Get favorite farmers (farmers with most orders)
      const favoriteFarmersResult = await query(`
        SELECT u.id, u.name, f.farmname, 
               COUNT(o.id) as order_count,
               COALESCE(AVG(f.ratingaverage), 0) as rating,
               COALESCE(f.totalreviews, 0) as total_reviews
        FROM users u
        INNER JOIN farmers f ON u.id = f.userid
        INNER JOIN orders o ON o.farmer_id = u.id
        WHERE o.customer_id = $1 AND o.status = 'delivered'
        GROUP BY u.id, u.name, f.farmname, f.ratingaverage, f.totalreviews
        ORDER BY order_count DESC
        LIMIT 3
      `, [userId])
      
      dashboardData.favoriteFarmers = favoriteFarmersResult.rows.map(farmer => ({
        id: farmer.id,
        name: farmer.name,
        farmName: farmer.farmname,
        rating: parseFloat(farmer.rating) || 0,
        reviews: parseInt(farmer.total_reviews) || 0
      }))
      
      console.log('Favorite farmers:', dashboardData.favoriteFarmers.length, 'found')
    } catch (err) {
      console.error('Error getting favorite farmers:', err.message)
    }

    console.log('Final customer dashboard data:', dashboardData)

    res.json({
      success: true,
      data: dashboardData,
      message: 'Customer dashboard data retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting customer dashboard data:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get customer dashboard data',
      error: error.message
    })
  }
}

module.exports = {
  getDashboardData
}
