const supabase = require('../config/supabase');
const { 
  notifyProductBackInStock, 
  notifyPriceDrop, 
  notifyFarmersNewProduct, 
  notifyPromotionalOffer 
} = require('../controllers/notificationController');
const logger = require('../config/logger');

// Marketing and Product Notification Service
class MarketingNotificationService {
  
  // Notify customers when a product is back in stock
  static async notifyProductBackInStock(productId, productName, farmerId) {
    try {
      // Get farmer information
      const { data: farmer } = await supabase
        .from('farmers')
        .select('farmname')
        .eq('userid', farmerId)
        .single();

      // Find customers who have shown interest in this product (viewed, added to cart, etc.)
      const { data: interestedCustomers } = await supabase
        .from('user_activity') // Assuming we track user activity
        .select('userid')
        .eq('productid', productId)
        .in('activity', ['viewed', 'cart_added', 'wishlist_added']);

      // Send notifications to interested customers
      for (const customer of interestedCustomers || []) {
        await notifyProductBackInStock(
          customer.userid,
          productId,
          productName,
          farmer?.farmname || 'Local Farmer'
        );
      }

      logger.info(`Sent back-in-stock notifications for product ${productName} to ${interestedCustomers?.length || 0} customers`);
    } catch (error) {
      logger.error('Error sending back-in-stock notifications:', error);
    }
  }

  // Notify customers about price drops
  static async notifyPriceDrop(productId, productName, farmerId, oldPrice, newPrice) {
    try {
      // Get farmer information
      const { data: farmer } = await supabase
        .from('farmers')
        .select('farmname')
        .eq('userid', farmerId)
        .single();

      // Find customers who have shown interest in this product
      const { data: interestedCustomers } = await supabase
        .from('user_activity')
        .select('userid')
        .eq('productid', productId)
        .in('activity', ['viewed', 'cart_added', 'wishlist_added']);

      // Send notifications to interested customers
      for (const customer of interestedCustomers || []) {
        await notifyPriceDrop(
          customer.userid,
          productId,
          productName,
          oldPrice,
          newPrice,
          farmer?.farmname || 'Local Farmer'
        );
      }

      logger.info(`Sent price drop notifications for product ${productName} to ${interestedCustomers?.length || 0} customers`);
    } catch (error) {
      logger.error('Error sending price drop notifications:', error);
    }
  }

  // Notify customers when farmer adds new product
  static async notifyFarmersNewProduct(farmerId, productId, productName) {
    try {
      // Get farmer information
      const { data: farmer } = await supabase
        .from('farmers')
        .select('farmname')
        .eq('userid', farmerId)
        .single();

      // Find customers who have purchased from this farmer before
      const { data: previousCustomers } = await supabase
        .from('orders')
        .select('userid')
        .eq('farmerid', farmerId)
        .not('userid', 'is', null);

      // Remove duplicates
      const uniqueCustomerIds = [...new Set(previousCustomers?.map(o => o.userid) || [])];

      // Send notifications to previous customers
      for (const customerId of uniqueCustomerIds) {
        await notifyFarmersNewProduct(
          customerId,
          farmerId,
          farmer?.farmname || 'Local Farmer',
          productName,
          productId
        );
      }

      logger.info(`Sent new product notifications for ${productName} to ${uniqueCustomerIds.length} previous customers`);
    } catch (error) {
      logger.error('Error sending new product notifications:', error);
    }
  }

  // Send promotional offers to targeted customers
  static async sendPromotionalOffer(offerData) {
    const { title, description, discountCode, validUntil, targetCustomers = 'all' } = offerData;
    
    try {
      let customerIds = [];

      if (targetCustomers === 'all') {
        // Get all active customers
        const { data: customers } = await supabase
          .from('consumers')
          .select('userid');
        customerIds = customers?.map(c => c.userid) || [];
      } else if (targetCustomers === 'active') {
        // Get customers who have ordered in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: activeCustomers } = await supabase
          .from('orders')
          .select('userid')
          .gte('createdat', thirtyDaysAgo.toISOString())
          .not('userid', 'is', null);
        
        customerIds = [...new Set(activeCustomers?.map(o => o.userid) || [])];
      }

      // Send promotional notifications
      for (const customerId of customerIds) {
        await notifyPromotionalOffer(
          customerId,
          title,
          description,
          discountCode,
          validUntil
        );
      }

      logger.info(`Sent promotional offer "${title}" to ${customerIds.length} customers`);
    } catch (error) {
      logger.error('Error sending promotional offer:', error);
    }
  }

  // Notify customers about upcoming subscription deliveries
  static async notifyUpcomingSubscriptionDeliveries() {
    try {
      // Get subscriptions due in the next 2 days
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      
      const { data: upcomingDeliveries } = await supabase
        .from('subscriptions')
        .select(`
          *,
          consumers!inner(userid),
          products!inner(name, farmerid)
        `)
        .eq('status', 'active')
        .lte('nextdeliverydate', twoDaysFromNow.toISOString())
        .gte('nextdeliverydate', new Date().toISOString().split('T')[0]);

      // Group by customer
      const customerDeliveries = {};
      for (const delivery of upcomingDeliveries || []) {
        if (!customerDeliveries[delivery.consumers.userid]) {
          customerDeliveries[delivery.consumers.userid] = [];
        }
        customerDeliveries[delivery.consumers.userid].push(delivery);
      }

      // Send notifications to each customer
      for (const [customerId, deliveries] of Object.entries(customerDeliveries)) {
        for (const delivery of deliveries) {
          const { notifySubscriptionDeliveryScheduled } = require('../controllers/notificationController');
          await notifySubscriptionDeliveryScheduled(
            customerId,
            delivery._id,
            delivery.nextdeliverydate,
            [{ name: delivery.products.name, id: delivery.products._id }]
          );
        }
      }

      logger.info(`Sent upcoming delivery notifications to ${Object.keys(customerDeliveries).length} customers`);
    } catch (error) {
      logger.error('Error sending upcoming delivery notifications:', error);
    }
  }
}

module.exports = MarketingNotificationService;
