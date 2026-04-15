const bcrypt = require('bcryptjs');
const { generateToken } = require('../middlewares/auth');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// Register user using Supabase client
const register = async (req, res, next) => {
  const { name, email, phone, password, role, ...roleSpecificData } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Validate role
    if (!['farmer', 'consumer', 'admin', 'dealer', 'expert'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be farmer, consumer, admin, dealer, or expert'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          phone,
          passwordhash: passwordHash,
          role,
          isverified: true,
          isbanned: false
        }
      ])
      .select()
      .single();

    if (userError) {
      logger.error('User creation error:', userError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Create role-specific data
    if (role === 'farmer') {
      const { farmName, description, farmingType, location, deliveryRadius } = roleSpecificData;
      
      // Farm name is optional during signup - can be updated in profile
      const { error: farmerError } = await supabase
        .from('farmers')
        .insert([
          {
            userid: user._id,
            farmname: farmName || null, // Optional during signup
            description: description || null,
            farmingtype: farmingType || 'mixed',
            location: location ? `POINT(${location.longitude || 0} ${location.latitude || 0})` : 'POINT(0 0)',
            deliveryradius: deliveryRadius || 5000,
            verificationstatus: 'pending'
          }
        ])
        .select()
        .single();

      if (farmerError) {
        logger.error('Farmer creation error:', farmerError);
        // Rollback user creation
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create farmer profile'
        });
      }
    } else if (role === 'consumer') {
      const { defaultAddress } = roleSpecificData;
      
      const consumerData = {
        userid: user._id
      };

      if (defaultAddress) {
        consumerData.defaultaddressstreet = defaultAddress.street;
        consumerData.defaultaddresscity = defaultAddress.city;
        consumerData.defaultaddressstate = defaultAddress.state;
        consumerData.defaultaddresspostalcode = defaultAddress.postalCode;
        consumerData.defaultaddresslocation = defaultAddress.location ? 
          `POINT(${defaultAddress.location.longitude || 0} ${defaultAddress.location.latitude || 0})` : 
          'POINT(0 0)';
      }

      const { error: consumerError } = await supabase
        .from('consumers')
        .insert([consumerData])
        .select()
        .single();

      if (consumerError) {
        logger.error('Consumer creation error:', consumerError);
        // Rollback user creation
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create consumer profile'
        });
      }
    } else if (role === 'dealer') {
      const { 
        businessName, 
        businessType, 
        licenseNumber, 
        businessAddress, 
        businessCity, 
        businessState, 
        businessPostalCode, 
        businessPhone, 
        businessEmail,
        description,
        minimumOrderQuantity,
        serviceDeliveryRadius,
        preferredCrops,
        paymentTerms
      } = roleSpecificData;

      if (!businessName || !licenseNumber || !businessAddress || !businessCity || 
          !businessState || !businessPostalCode || !businessPhone || !businessEmail) {
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(400).json({
          success: false,
          error: 'All business information is required for dealer registration'
        });
      }

      const { error: dealerError } = await supabase
        .from('dealers')
        .insert([
          {
            userid: user._id,
            businessname: businessName,
            businesstype: businessType || 'wholesale',
            licensenumber: licenseNumber,
            businessaddress: businessAddress,
            businesscity: businessCity,
            businessstate: businessState,
            businesspostalcode: businessPostalCode,
            businessphone: businessPhone,
            businessemail: businessEmail,
            description: description || null,
            minimumorderquantity: minimumOrderQuantity || 1,
            servicedeliveryradius: serviceDeliveryRadius || 50,
            preferredcrops: preferredCrops || [],
            paymentterms: paymentTerms || 'COD'
          }
        ])
        .select()
        .single();

      if (dealerError) {
        logger.error('Dealer creation error:', dealerError);
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create dealer profile'
        });
      }
    } else if (role === 'expert') {
      const { 
        specialization, 
        expertiseLevel, 
        qualifications, 
        experienceYears, 
        consultationFee, 
        availabilityStatus,
        consultationHours,
        languages,
        description
      } = roleSpecificData;

      if (!specialization || !expertiseLevel) {
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(400).json({
          success: false,
          error: 'Specialization and expertise level are required for expert registration'
        });
      }

      const { error: expertError } = await supabase
        .from('experts')
        .insert([
          {
            userid: user._id,
            specialization: specialization,
            expertiselevel: expertiseLevel,
            qualifications: qualifications || [],
            experienceyears: experienceYears || 0,
            consultationfee: consultationFee || 0.00,
            availabilitystatus: availabilityStatus || 'available',
            consultationhours: consultationHours || [],
            languages: languages || ['English'],
            description: description || null
          }
        ])
        .select()
        .single();

      if (expertError) {
        logger.error('Expert creation error:', expertError);
        await supabase.from('users').delete().eq('_id', user._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create expert profile'
        });
      }
    }

    // Generate JWT token
    const token = generateToken({ 
      id: user._id, 
      email: user.email, 
      role: user.role 
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isverified,
          isBanned: user.isbanned,
          createdAt: user.createdat
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// Login user using Supabase client
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        _id, name, email, phone, passwordhash, role, 
        isverified, isbanned, lastloginat
      `)
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is banned
    if (user.isbanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordhash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ lastloginat: new Date().toISOString() })
      .eq('_id', user._id);

    // Get role-specific data
    let roleData = {};
    if (user.role === 'farmer') {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('farmname, verificationstatus, ratingaverage, totalsales')
        .eq('userid', user._id)
        .single();
      
      if (farmerData) {
        roleData = {
          farmName: farmerData.farmname,
          verificationStatus: farmerData.verificationstatus,
          ratingAverage: farmerData.ratingaverage,
          totalSales: farmerData.totalsales
        };
      }
    } else if (user.role === 'consumer') {
      const { data: consumerData } = await supabase
        .from('consumers')
        .select('walletbalance, totalorders')
        .eq('userid', user._id)
        .single();
      
      if (consumerData) {
        roleData = {
          walletBalance: consumerData.walletbalance,
          totalOrders: consumerData.totalorders
        };
      }
    }

    // Generate JWT token
    const token = generateToken({ 
      id: user._id, 
      email: user.email, 
      role: user.role 
    });

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isverified,
          lastLoginAt: user.lastloginat,
          ...roleData
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Get user profile using Supabase client
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        _id, name, email, phone, role, 
        isverified, isbanned, createdat, lastloginat
      `)
      .eq('_id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get role-specific data
    let roleData = {};
    if (user.role === 'farmer') {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('*')
        .eq('userid', user._id)
        .single();
      
      if (farmerData) {
        roleData = farmerData;
      }
    } else if (user.role === 'consumer') {
      const { data: consumerData } = await supabase
        .from('consumers')
        .select('*')
        .eq('userid', user._id)
        .single();
      
      if (consumerData) {
        roleData = consumerData;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          ...roleData
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

// Update user profile using Supabase client
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, ...roleSpecificData } = req.body;

    // Update user basic info
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('_id', userId);

      if (userError) {
        logger.error('User update error:', userError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
      }
    }

    // Update role-specific data
    const user = await supabase
      .from('users')
      .select('role')
      .eq('_id', userId)
      .single();

    if (user.data.role === 'farmer' && Object.keys(roleSpecificData).length > 0) {
      const { error: farmerError } = await supabase
        .from('farmers')
        .update(roleSpecificData)
        .eq('userid', userId);

      if (farmerError) {
        logger.error('Farmer update error:', farmerError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update farmer profile'
        });
      }
    } else if (user.data.role === 'consumer' && Object.keys(roleSpecificData).length > 0) {
      const { error: consumerError } = await supabase
        .from('consumers')
        .update(roleSpecificData)
        .eq('userid', userId);

      if (consumerError) {
        logger.error('Consumer update error:', consumerError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update consumer profile'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
