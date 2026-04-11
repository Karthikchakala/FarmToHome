const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// Add item to cart
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    console.log('DEBUG: Cart add request:', { userId, productId, quantity });
    console.log('DEBUG: Request body:', req.body);

    // Validate input
    if (!productId) {
      console.log('ERROR: Product ID is missing');
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    if (quantity < 1) {
      console.log('ERROR: Invalid quantity:', quantity);
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1'
      });
    }

    // Check if product exists and is available using Supabase
    console.log('DEBUG: Checking product existence:', productId);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('_id, name, priceperunit, stockquantity, isavailable')
      .eq('_id', productId)
      .eq('isavailable', true)
      .single();

    console.log('DEBUG: Product query result:', { product, productError });

    if (productError || !product) {
      console.log('ERROR: Product not found or not available:', productError);
      return res.status(404).json({
        success: false,
        error: 'Product not found or not available'
      });
    }

    // Check if requested quantity is available
    console.log('DEBUG: Stock check:', { requested: quantity, available: product.stockquantity });
    if (product.stockquantity < quantity) {
      console.log('ERROR: Insufficient stock');
      return res.status(400).json({
        success: false,
        error: `Only ${product.stockquantity} units available. Cannot add ${quantity} units.`
      });
    }

    // Check if item already exists in cart using Supabase
    const { data: existingItem, error: existingError } = await supabase
      .from('cart')
      .select('quantity')
      .eq('userid', userId)
      .eq('productid', productId)
      .single();

    let result;
    if (existingItem) {
      // Update existing quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock again
      if (product.stockquantity < newQuantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stockquantity} units available in stock`
        });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart')
        .update({ quantity: newQuantity, updatedat: new Date().toISOString() })
        .eq('userid', userId)
        .eq('productid', productId)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedItem;
    } else {
      // Add new item to cart using Supabase
      const { data: newItem, error: insertError } = await supabase
        .from('cart')
        .insert({
          userid: userId,
          productid: productId,
          quantity: quantity,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      result = newItem;
    }

    logger.info(`Item added to cart: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    res.status(200).json({
      success: true,
      message: existingItem ? 'Cart updated successfully' : 'Item added to cart',
      data: {
        cartItem: result
      }
    });

  } catch (error) {
    logger.error('Add to cart error:', error);
    console.error('Cart error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
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

    // Calculate additional fees (waived as discount)
    const deliveryCharge = 0; // Free delivery
    const platformCommission = 0; // Free platform fee
    const finalAmount = totalAmount + deliveryCharge + platformCommission;

    res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          totalItems,
          totalAmount,
          deliveryCharge,
          platformCommission,
          finalAmount,
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

    // Check if product exists and get stock using Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stockquantity, isavailable')
      .eq('_id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

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

    // Update cart item using Supabase
    const { data: result, error: updateError } = await supabase
      .from('cart')
      .update({ quantity: quantity, updatedat: new Date().toISOString() })
      .eq('userid', userId)
      .eq('productid', productId)
      .select()
      .single();

    if (updateError || !result) {
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
        cartItem: result
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

    // Delete from cart using Supabase
    const { data: result, error: deleteError } = await supabase
      .from('cart')
      .delete()
      .eq('userid', userId)
      .eq('productid', productId)
      .select()
      .single();

    if (deleteError || !result) {
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
        deletedItem: result
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

    // Delete all cart items for user using Supabase
    const { data: result, error: deleteError } = await supabase
      .from('cart')
      .delete()
      .eq('userid', userId)
      .select();

    if (deleteError) {
      throw deleteError;
    }

    const itemsRemoved = result ? result.length : 0;
    logger.info(`Cart cleared: userId=${userId}, itemsRemoved=${itemsRemoved}`);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        removedItems: itemsRemoved
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

    // Get cart items count using Supabase
    const { data: cartItems, error } = await supabase
      .from('cart')
      .select('quantity')
      .eq('userid', userId);

    if (error) {
      throw error;
    }

    const itemCount = cartItems ? cartItems.length : 0;
    const totalItems = cartItems ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.status(200).json({
      success: true,
      data: {
        itemCount: itemCount,
        totalItems: totalItems
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
