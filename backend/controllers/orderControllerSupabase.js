// Place new order with delivery validation - CONVERTED TO SUPABASE
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { deliveryAddress, paymentMethod = 'COD', notes } = req.body;

  // Validate input
  if (!deliveryAddress) {
    throw new ValidationError('Delivery address is required');
  }

  // Get customer's default address if not provided
  let customerAddress = deliveryAddress;
  if (!customerAddress.latitude || !customerAddress.longitude) {
    const { data: consumerData, error: consumerError } = await supabase
      .from('consumers')
      .select('latitude, longitude, defaultaddressstreet, defaultaddresscity, defaultaddressstate, defaultaddresspostalcode')
      .eq('userid', userId)
      .single();
    
    if (consumerError && consumerError.code !== 'PGRST116') {
      throw new Error('Failed to fetch consumer address');
    }
    
    if (consumerData?.latitude && consumerData?.longitude) {
      customerAddress = {
        ...customerAddress,
        latitude: consumerData.latitude,
        longitude: consumerData.longitude,
        street: consumerData.defaultaddressstreet,
        city: consumerData.defaultaddresscity,
        state: consumerData.defaultaddressstate,
        pincode: consumerData.defaultaddresspostalcode
      };
    }
  }

  // Validate customer coordinates
  if (!customerAddress.latitude || !customerAddress.longitude) {
    throw new ValidationError('Customer location coordinates are required');
  }

  // Get cart items with product and farmer details using Supabase
  const { data: cartItems, error: cartError } = await supabase
    .from('cart')
    .select(`
      _id,
      quantity,
      productid,
      products!inner(
        name,
        priceperunit,
        stockquantity,
        isavailable,
        farmerid,
        farmers!inner(
          location,
          deliveryradius,
          farmname,
          latitude,
          longitude
        )
      )
    `)
    .eq('userid', userId);

  if (cartError) {
    logger.error('Error fetching cart:', cartError);
    throw new Error('Failed to fetch cart');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Validate stock availability and product availability
  for (const cartItem of cartItems) {
    const product = cartItem.products;
    if (!product.isavailable) {
      throw new ValidationError(`${product.name} is currently not available`);
    }
    
    if (product.stockquantity < cartItem.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${product.name}. Available: ${product.stockquantity}, Requested: ${cartItem.quantity}`
      );
    }
  }

  // Validate delivery for each farmer
  const farmerValidationResults = [];
  for (const cartItem of cartItems) {
    const farmer = cartItem.products.farmers;
    
    if (!farmer.latitude || !farmer.longitude) {
      throw new ValidationError(`Farmer location not available for ${farmer.farmname}`);
    }

    const distance = calculateDistance(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmer.latitude,
      farmer.longitude
    );

    const deliveryRadius = farmer.deliveryradius || 8;
    const canDeliver = isWithinRadius(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmer.latitude,
      farmer.longitude,
      deliveryRadius
    );

    if (!canDeliver) {
      throw new ValidationError(
        `${farmer.farmname} cannot deliver to your location. Distance: ${distance.toFixed(2)}km, Delivery radius: ${deliveryRadius}km`
      );
    }

    farmerValidationResults.push({
      farmerId: cartItem.products.farmerid,
      farmerName: farmer.farmname,
      distance: Math.round(distance * 100) / 100,
      deliveryRadius,
      deliveryCharge: calculateDeliveryCharge(distance),
      deliveryTime: getDeliveryTimeEstimate(distance)
    });
  }

  // Group cart items by farmer
  const cartByFarmer = {};
  let totalAmount = 0;
  let totalDeliveryCharge = 0;

  for (const cartItem of cartItems) {
    const farmerId = cartItem.products.farmerid;
    const farmer = cartItem.products.farmers;
    
    if (!cartByFarmer[farmerId]) {
      cartByFarmer[farmerId] = {
        farmerId,
        farmerName: farmer.farmname,
        items: [],
        subtotal: 0,
        deliveryCharge: 0
      };
    }

    const itemTotal = cartItem.quantity * cartItem.products.priceperunit;
    cartByFarmer[farmerId].items.push({
      productId: cartItem.productid,
      productName: cartItem.products.name,
      quantity: cartItem.quantity,
      pricePerUnit: cartItem.products.priceperunit,
      total: itemTotal
    });

    cartByFarmer[farmerId].subtotal += itemTotal;
    totalAmount += itemTotal;
  }

  // Calculate delivery charges
  for (const farmerId in cartByFarmer) {
    const validation = farmerValidationResults.find(v => v.farmerId === farmerId);
    if (validation) {
      cartByFarmer[farmerId].deliveryCharge = validation.deliveryCharge;
      cartByFarmer[farmerId].distance = validation.distance;
      cartByFarmer[farmerId].deliveryTime = validation.deliveryTime;
      totalDeliveryCharge += validation.deliveryCharge;
    }
  }

  // Platform commission (5%)
  const platformCommission = Math.round(totalAmount * 0.05);
  const finalAmount = totalAmount + totalDeliveryCharge + platformCommission;

  // Create orders for each farmer using Supabase
  const orderIds = [];
  const createdOrders = [];

  try {
    for (const farmerId in cartByFarmer) {
      const farmerOrder = cartByFarmer[farmerId];
      const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const orderTotal = farmerOrder.subtotal + farmerOrder.deliveryCharge;
      const orderPlatformCommission = Math.round(farmerOrder.subtotal * 0.05);

      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          userid: userId,
          farmerid: farmerId,
          ordernumber: orderNumber,
          totalamount: orderTotal,
          deliveryaddressstreet: customerAddress.street || customerAddress,
          deliveryaddresscity: customerAddress.city || null,
          deliveryaddressstate: customerAddress.state || null,
          deliveryaddresspostalcode: customerAddress.pincode || null,
          deliveryaddresslocation: customerAddress.latitude && customerAddress.longitude 
            ? `POINT(${customerAddress.longitude} ${customerAddress.latitude})`
            : null,
          paymentmethod: paymentMethod,
          status: 'PLACED',
          items: farmerOrder.items,
          deliverycharge: farmerOrder.deliveryCharge,
          platformcommission: orderPlatformCommission,
          notes: notes || null,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating order:', insertError);
        throw new Error(`Failed to create order: ${insertError.message}`);
      }

      orderIds.push(newOrder._id);
      createdOrders.push(newOrder);
    }

    // Update product stock
    for (const cartItem of cartItems) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stockquantity: cartItem.products.stockquantity - cartItem.quantity,
          updatedat: new Date().toISOString()
        })
        .eq('_id', cartItem.productid)
        .gte('stockquantity', cartItem.quantity); // Only update if sufficient stock

      if (updateError) {
        logger.error('Error updating stock:', updateError);
        throw new ValidationError(`Failed to update stock for ${cartItem.products.name}`);
      }
    }

    // Clear cart
    const { error: deleteError } = await supabase
      .from('cart')
      .delete()
      .eq('userid', userId);

    if (deleteError) {
      logger.error('Error clearing cart:', deleteError);
      // Don't throw error, just log it - order is already placed
    }

    // Format orders for response
    const orders = createdOrders.map(order => ({
      ...order,
      items: order.items || [],
      deliveryaddress: {
        street: order.deliveryaddressstreet,
        city: order.deliveryaddresscity,
        state: order.deliveryaddressstate,
        postalCode: order.deliveryaddresspostalcode
      }
    }));

    // Send email notifications (non-blocking)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('_id', userId)
        .single();

      for (const order of orders) {
        // Get farmer email
        const { data: farmerData } = await supabase
          .from('farmers')
          .select('users(email, name)')
          .eq('_id', order.farmerid)
          .single();

        const orderEmailData = {
          orderNumber: order.ordernumber,
          customerName: userData?.name || 'Customer',
          customerEmail: userData?.email,
          farmerName: farmerData?.users?.name || 'Farmer',
          farmerEmail: farmerData?.users?.email,
          orderDate: order.createdat,
          totalAmount: order.totalamount,
          paymentMethod: order.paymentmethod,
          deliveryAddress: JSON.stringify(order.deliveryaddress),
          items: order.items.map(item => ({
            name: item.productName || 'Product',
            quantity: item.quantity,
            unit: 'unit',
            price: item.pricePerUnit,
            total: item.total
          })),
          estimatedDelivery: getDeliveryTimeEstimate(order.deliveryaddress)
        };

        sendOrderConfirmationEmails(orderEmailData).catch(emailError => {
          logger.error(`Failed to send order confirmation emails for order ${order.ordernumber}:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in email notification process:', emailError);
      // Don't fail the order if email fails
    }

    logger.info(`Order placed successfully: userId=${userId}, orderCount=${orders.length}, totalAmount=${finalAmount}`);

    return responseHelper.created(res, {
      orders,
      summary: {
        totalItems: cartItems.length,
        totalAmount,
        totalDeliveryCharge,
        platformCommission,
        finalAmount,
        orderCount: orders.length
      }
    }, 'Order placed successfully');

  } catch (error) {
    logger.error('Place order error:', error);
    console.error('Place Order 500 Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
});
