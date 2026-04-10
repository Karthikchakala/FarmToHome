// Customer controller for customer-specific operations

const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const getDashboardData = async (req, res) => {
  try {
    console.log('Getting customer dashboard data...')
    
    const userId = req.user._id
    
    // First get the consumer ID for this user
    const { data: consumerData, error: consumerError } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single()
    
    if (consumerError || !consumerData) {
      return responseHelper.success(res, {
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalSpent: 0,
        monthlySpent: 0,
        savedAmount: 0,
        activeSubscriptions: 0,
        recentOrders: []
      }, 'Customer dashboard data retrieved successfully')
    }
    
    const consumerId = consumerData._id
    
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
      recentOrders: []
    }
    
    try {
      // Get order statistics
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('totalamount, status')
        .eq('consumerid', consumerId)
      
      if (!ordersError && ordersData) {
        dashboardData.totalOrders = ordersData.length
        dashboardData.activeOrders = ordersData.filter(order => 
          ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order.status)
        ).length
        dashboardData.completedOrders = ordersData.filter(order => 
          order.status === 'DELIVERED'
        ).length
        dashboardData.pendingOrders = ordersData.filter(order => 
          ['PLACED', 'CONFIRMED'].includes(order.status)
        ).length
        
        // Fix: Include all non-cancelled orders for total spending
        dashboardData.totalSpent = ordersData
          .filter(order => order.status !== 'CANCELLED')
          .reduce((sum, order) => sum + (parseFloat(order.totalamount) || 0), 0)
      }
      
      console.log('Order stats:', dashboardData.totalOrders, 'orders')
    } catch (err) {
      console.error('Error getting order stats:', err.message)
    }
    
    try {
      // Get monthly spending - include all non-cancelled orders this month
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('orders')
        .select('totalamount')
        .eq('consumerid', consumerId)
        .neq('status', 'CANCELLED') // Exclude cancelled orders
        .gte('createdat', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      
      if (!monthlyError && monthlyData) {
        dashboardData.monthlySpent = monthlyData.reduce((sum, order) => 
          sum + (parseFloat(order.totalamount) || 0), 0
        )
      }
      
      console.log('Monthly spending:', dashboardData.monthlySpent)
    } catch (err) {
      console.error('Error getting monthly spending:', err.message)
    }
    
    try {
      // Get active subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('consumerid', consumerId)
        .eq('status', 'ACTIVE')
      
      if (!subscriptionsError && subscriptionsData) {
        dashboardData.activeSubscriptions = subscriptionsData.length
      }
      
      console.log('Active subscriptions:', dashboardData.activeSubscriptions)
    } catch (err) {
      console.error('Error getting subscriptions:', err.message)
    }
    
    try {
      // Get recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('_id, totalamount, status, createdat, ordernumber, items')
        .eq('consumerid', consumerId)
        .order('createdat', { ascending: false })
        .limit(5)
      
      if (!recentOrdersError && recentOrdersData) {
        dashboardData.recentOrders = recentOrdersData.map(order => ({
          id: order._id,
          orderNumber: order.ordernumber,
          amount: parseFloat(order.totalamount) || 0,
          status: order.status,
          date: new Date(order.createdat).toLocaleDateString(),
          items: Array.isArray(order.items) ? order.items.length : 0
        }))
      }
      
      console.log('Recent orders:', dashboardData.recentOrders.length, 'found')
    } catch (err) {
      console.error('Error getting recent orders:', err.message)
    }

    console.log('Final customer dashboard data:', dashboardData)

    responseHelper.success(res, dashboardData, 'Customer dashboard data retrieved successfully')
  } catch (error) {
    console.error('Error getting customer dashboard data:', error)
    responseHelper.error(res, 'Failed to get customer dashboard data', 500)
  }
}

module.exports = {
  getDashboardData
}
