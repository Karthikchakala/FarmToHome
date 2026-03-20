// Temporary admin controller for testing
// This should be replaced with proper database integration

const { query } = require('../db')
const supabase = require('../config/supabaseClient')

const getDashboardStats = async (req, res) => {
  try {
    console.log('Getting dashboard stats using Supabase...')
    
    let stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      pendingApprovals: 0,
      systemHealth: 'Good'
    }
    
    // Get total users
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      if (!error) {
        stats.totalUsers = count || 0
        console.log('Total users:', stats.totalUsers)
      }
    } catch (err) {
      console.error('Error getting users count:', err.message)
    }
    
    // Get active users (verified users)
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('isverified', true)
      if (!error) {
        stats.activeUsers = count || 0
        console.log('Active users:', stats.activeUsers)
      }
    } catch (err) {
      console.error('Error getting active users count:', err.message)
    }
    
    // Get total orders
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      if (!error) {
        stats.totalOrders = count || 0
        console.log('Total orders:', stats.totalOrders)
      }
    } catch (err) {
      console.error('Error getting orders count:', err.message)
    }
    
    // Get total products
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      if (!error) {
        stats.totalProducts = count || 0
        console.log('Total products:', stats.totalProducts)
      }
    } catch (err) {
      console.error('Error getting products count:', err.message)
    }
    
    // Get pending farmer approvals
    try {
      const { count, error } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true })
        .eq('verificationstatus', 'pending')
      if (!error) {
        stats.pendingApprovals = count || 0
        console.log('Pending approvals:', stats.pendingApprovals)
      }
    } catch (err) {
      console.error('Error getting pending approvals count:', err.message)
    }
    
    // Calculate total revenue from orders
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('finalamount')
        .eq('status', 'COMPLETED')
      if (!error && data) {
        stats.totalRevenue = data.reduce((sum, order) => sum + parseFloat(order.finalamount || 0), 0)
        console.log('Total revenue:', stats.totalRevenue)
      }
    } catch (err) {
      console.error('Error calculating revenue:', err.message)
    }

    console.log('Final stats:', stats)

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    })
  }
}

const getUsers = async (req, res) => {
  try {
    console.log('Getting all users using Supabase...')
    
    let users = []
    
    try {
      // Get all users using Supabase
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('createdat', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      console.log('Users query result:', usersData?.length || 0, 'users found')
      
      users = usersData.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isverified,
        isBanned: user.isbanned,
        profileImageUrl: user.profileimageurl,
        lastLoginAt: user.lastloginat,
        createdAt: user.createdat,
        updatedAt: user.updatedat
      }))
      
    } catch (err) {
      console.error('Error in users query:', err.message)
    }

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    })
  }
}

const getFarmers = async (req, res) => {
  try {
    console.log('Getting farmers using Supabase...')
    
    let farmers = []
    
    try {
      // Get farmers with user info using Supabase
      const { data: farmersData, error } = await supabase
        .from('farmers')
        .select(`
          _id,
          userid,
          farmname,
          description,
          farmingtype,
          verificationstatus,
          isapproved,
          ratingaverage,
          totalreviews,
          totalsales,
          createdat,
          users!inner (
            _id,
            name,
            email,
            phone,
            isverified,
            createdat
          )
        `)
        .order('createdat', { ascending: false })

      if (error) {
        console.error('Error fetching farmers:', error)
        throw error
      }

      console.log('Farmers query result:', farmersData?.length || 0, 'farmers found')
      
      farmers = farmersData.map(farmer => ({
        _id: farmer._id,
        userid: farmer.userid,
        farmname: farmer.farmname,
        description: farmer.description,
        farmingtype: farmer.farmingtype,
        verificationstatus: farmer.verificationstatus,
        isapproved: farmer.isapproved,
        ratingaverage: farmer.ratingaverage || 0,
        totalreviews: farmer.totalreviews || 0,
        totalsales: farmer.totalsales || 0,
        name: farmer.users.name,
        email: farmer.users.email,
        phone: farmer.users.phone,
        isVerified: farmer.users.isverified,
        createdAt: farmer.createdat
      }))
      
    } catch (err) {
      console.error('Error in farmers query:', err.message)
    }

    res.json({
      success: true,
      data: farmers,
      message: 'Farmers retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting farmers:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get farmers',
      error: error.message
    })
  }
}

const approveFarmer = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Approving farmer:', id)

    // Update farmer status using Supabase
    const { data: farmer, error } = await supabase
      .from('farmers')
      .update({ 
        verificationstatus: 'approved',
        isapproved: true,
        updatedat: new Date().toISOString()
      })
      .eq('_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error approving farmer:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to approve farmer',
        error: error.message
      })
    }

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      })
    }

    res.json({
      success: true,
      data: farmer,
      message: 'Farmer approved successfully'
    })
  } catch (error) {
    console.error('Error approving farmer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve farmer',
      error: error.message
    })
  }
}

const rejectFarmer = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    console.log('Rejecting farmer:', id, 'Reason:', reason)

    // Update farmer status using Supabase
    const { data: farmer, error } = await supabase
      .from('farmers')
      .update({ 
        verificationstatus: 'rejected',
        isapproved: false,
        updatedat: new Date().toISOString()
      })
      .eq('_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error rejecting farmer:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to reject farmer',
        error: error.message
      })
    }

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      })
    }

    res.json({
      success: true,
      data: farmer,
      message: 'Farmer rejected successfully'
    })
  } catch (error) {
    console.error('Error rejecting farmer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject farmer',
      error: error.message
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Getting user by ID:', id)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('_id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: error.message
      })
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const transformedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isverified,
      isBanned: user.isbanned,
      profileImageUrl: user.profileimageurl,
      lastLoginAt: user.lastloginat,
      createdAt: user.createdat,
      updatedAt: user.updatedat
    }

    res.json({
      success: true,
      data: transformedUser,
      message: 'User retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    console.log('Updating user:', id, updateData)

    // Remove sensitive fields that shouldn't be updated directly
    const { _id, createdat, passwordhash, ...allowedUpdates } = updateData

    const { data: user, error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      })
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Deleting user:', id)

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('_id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      })
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    })
  }
}

const getFarmerProducts = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Getting products for farmer:', id)

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmerid', id)
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Error fetching farmer products:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch farmer products',
        error: error.message
      })
    }

    console.log(`Found ${products?.length || 0} products for farmer`)

    res.json({
      success: true,
      data: products || [],
      message: 'Farmer products retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting farmer products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get farmer products',
      error: error.message
    })
  }
}

const getAllProducts = async (req, res) => {
  try {
    console.log('Getting all products using Supabase...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner (
          _id,
          farmname,
          users!inner (
            name,
            email,
            phone
          )
        )
      `)
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      })
    }

    console.log(`Found ${products?.length || 0} products`)

    // Transform the data to include farmer info
    const transformedProducts = products.map(product => ({
      ...product,
      farmer: {
        _id: product.farmers._id,
        farmname: product.farmers.farmname,
        name: product.farmers.users.name,
        email: product.farmers.users.email,
        phone: product.farmers.users.phone
      }
    }))

    res.json({
      success: true,
      data: transformedProducts || [],
      message: 'Products retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message
    })
  }
}

const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Getting product by ID:', id)

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner (
          _id,
          farmname,
          users!inner (
            name,
            email,
            phone
          )
        )
      `)
      .eq('_id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: error.message
      })
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Transform the data to include farmer info
    const transformedProduct = {
      ...product,
      farmer: {
        _id: product.farmers._id,
        farmname: product.farmers.farmname,
        name: product.farmers.users.name,
        email: product.farmers.users.email,
        phone: product.farmers.users.phone
      }
    }

    res.json({
      success: true,
      data: transformedProduct,
      message: 'Product retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Deleting product:', id)

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('_id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      })
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    })
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getFarmers,
  getFarmerProducts,
  approveFarmer,
  rejectFarmer,
  getAllProducts,
  getProductById,
  deleteProduct
}
