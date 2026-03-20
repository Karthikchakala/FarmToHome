const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// Add item to cart
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1'
      });
    }

    // Check if product exists and is available
    const productResult = await query(
      'SELECT _id, name, priceperunit, stockquantity, isavailable FROM products WHERE _id = $1 AND isavailable = true',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or not available'
      });
    }

    const product = productResult.rows[0];

    // Check if requested quantity is available
    if (product.stockquantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stockquantity} units available`
      });
    }

    // Check if item already exists in cart
    const existingItemResult = await query(
      'SELECT quantity FROM cart WHERE userid = $1 AND productid = $2',
      [userId, productId]
    );

    let result;
    if (existingItemResult.rows.length > 0) {
      // Update existing quantity
      const newQuantity = existingItemResult.rows[0].quantity + quantity;
      
      // Check stock again
      if (product.stockquantity < newQuantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stockquantity} units available in stock`
        });
      }

      result = await query(
        'UPDATE cart SET quantity = $1, updatedat = CURRENT_TIMESTAMP WHERE userid = $2 AND productid = $3 RETURNING *',
        [newQuantity, userId, productId]
      );
    } else {
      // Add new item to cart
      result = await query(
        'INSERT INTO cart (userid, productid, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity]
      );
    }

    logger.info(`Item added to cart: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    res.status(200).json({
      success: true,
      message: existingItemResult.rows.length > 0 ? 'Cart updated successfully' : 'Item added to cart',
      data: {
        cartItem: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Add to cart error:', error);
    next(error);
  }
};

// Get cart items
const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Use Supabase query instead of PostgreSQL
    const { data: cartItems, error } = await supabase
      .from('cart')
      .select(`
        *,
        products(
          *,
          farmers!inner(
            farmname,
            users!inner(
              name
            )
          )
        )
      `)
      .eq('userid', userId)
      .eq('products.isavailable', true)
      .order('createdat', { ascending: false });

    // Handle case where cart table doesn't exist
    if (error && error.code === 'PGRST205') {
      // Cart table doesn't exist, return empty cart
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          summary: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 0
          }
        }
      });
    }

    if (error) {
      logger.error('Get cart error:', error);
      throw new Error('Failed to fetch cart');
    }

    // Calculate totals and format response
    let totalAmount = 0;
    let totalItems = 0;
    const formattedItems = cartItems.map(item => {
      const subtotal = (item.products?.priceperunit || 0) * item.quantity;
      totalAmount += subtotal;
      totalItems += item.quantity;
      
      return {
        _id: item._id,
        quantity: item.quantity,
        createdat: item.createdat,
        updatedat: item.updatedat,
        product_id: item.productid,
        product_name: item.products?.name || 'Unknown Product',
        product_description: item.products?.description || '',
        priceperunit: item.products?.priceperunit || 0,
        unit: item.products?.unit || '',
        stockquantity: item.products?.stockquantity || 0,
        images: item.products?.images || [],
        category: item.products?.category || '',
        farmname: item.products?.farmers?.farmname || 'Unknown Farm',
        farmer_name: item.products?.farmers?.users?.name || 'Unknown Farmer',
        subtotal
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          totalItems,
          totalAmount,
          itemCount: formattedItems.length
        }
      }
    });
  } catch (error) {
    logger.error('Get cart error:', error);
    next(error);
  }
};

// Update cart item quantity
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1'
      });
    }

    // Check if product exists and get stock
    const productResult = await query(
      'SELECT stockquantity, isavailable FROM products WHERE _id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    if (!product.isavailable) {
      return res.status(400).json({
        success: false,
        error: 'Product is not available'
      });
    }

    if (product.stockquantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stockquantity} units available`
      });
    }

    // Update cart item
    const result = await query(
      'UPDATE cart SET quantity = $1, updatedat = CURRENT_TIMESTAMP WHERE userid = $2 AND productid = $3 RETURNING *',
      [quantity, userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    logger.info(`Cart item updated: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        cartItem: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Update cart error:', error);
    next(error);
  }
};

// Remove item from cart
const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const result = await query(
      'DELETE FROM cart WHERE userid = $1 AND productid = $2 RETURNING *',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    logger.info(`Item removed from cart: userId=${userId}, productId=${productId}`);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        deletedItem: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Remove from cart error:', error);
    next(error);
  }
};

// Clear entire cart
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await query(
      'DELETE FROM cart WHERE userid = $1 RETURNING *',
      [userId]
    );

    logger.info(`Cart cleared: userId=${userId}, itemsRemoved=${result.rows.length}`);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        removedItems: result.rows.length
      }
    });

  } catch (error) {
    logger.error('Clear cart error:', error);
    next(error);
  }
};

// Get cart summary (for header/cart icon)
const getCartSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await query(
      'SELECT COUNT(*) as item_count, COALESCE(SUM(quantity), 0) as total_items FROM cart WHERE userid = $1',
      [userId]
    );

    const summary = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        itemCount: parseInt(summary.item_count),
        totalItems: parseInt(summary.total_items)
      }
    });

  } catch (error) {
    logger.error('Get cart summary error:', error);
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
};
