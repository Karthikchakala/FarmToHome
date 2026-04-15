const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');
const { generateToken } = require('../middlewares/auth');
const logger = require('../config/logger');

// Register user
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

    // Insert user using Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        phone,
        passwordhash: passwordHash,
        role
      }])
      .select()
      .single();

    if (userError) {
      // Handle duplicate key errors
      if (userError.code === '23505') {
        const constraint = userError.constraint;
        if (constraint.includes('email')) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists'
          });
        } else if (constraint.includes('phone')) {
          return res.status(409).json({
            success: false,
            error: 'Phone number already exists'
          });
        }
      }
      throw userError;
    }

    const user = userData;

    // Insert role-specific data using Supabase
    if (role === 'farmer') {
      const { farmName, description, farmingType, location, deliveryRadius } = roleSpecificData;
      
      if (!farmName) {
        throw new Error('Farm name is required for farmer registration');
      }

      const { error: farmerError } = await supabase
        .from('farmers')
        .insert([{
          userid: user._id,
          farmname: farmName,
          description: description || null,
          farmingtype: farmingType || 'mixed',
          location: location || null,
          deliveryradius: deliveryRadius || 5000,
          verificationstatus: 'pending',
          isapproved: false
        }]);

      if (farmerError) throw farmerError;
    } else if (role === 'consumer') {
      const { defaultAddress } = roleSpecificData;
      
      if (defaultAddress) {
        const { error: consumerError } = await supabase
          .from('consumers')
          .insert([{
            userid: user._id,
            defaultaddressstreet: defaultAddress.street || null,
            defaultaddresscity: defaultAddress.city || null,
            defaultaddressstate: defaultAddress.state || null,
            defaultaddresspostalcode: defaultAddress.postalCode || null,
            defaultaddresslocation: defaultAddress.location || null
          }]);

        if (consumerError) throw consumerError;
      } else {
        const { error: consumerError } = await supabase
          .from('consumers')
          .insert([{
            userid: user._id
          }]);

        if (consumerError) throw consumerError;
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
        throw new Error('All business information is required for dealer registration');
      }

      const { error: dealerError } = await supabase
        .from('dealers')
        .insert([{
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
        }]);

      if (dealerError) throw dealerError;
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
        throw new Error('Specialization and expertise level are required for expert registration');
      }

      const { error: expertError } = await supabase
        .from('experts')
        .insert([{
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
        }]);

      if (expertError) throw expertError;
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    logger.info(`New user registered: ${email} with role: ${role}`);

    // Custom message based on role
    let message = 'User registered successfully';
    if (role === 'farmer') {
      message = 'Farmer registration submitted successfully. Your account is pending admin approval.';
    }

    res.status(201).json({
      success: true,
      message: message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isverified,
          isBanned: user.isbanned,
          needsApproval: role === 'farmer'
        },
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === '23505') {
      const constraint = error.constraint;
      if (constraint.includes('email')) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      } else if (constraint.includes('phone')) {
        return res.status(409).json({
          success: false,
          error: 'Phone number already exists'
        });
      }
    }

    next(error);
  }
};

// Login user
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
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('_id, name, email, phone, passwordhash, role, isverified, isbanned, lastloginat')
      .eq('email', email)
      .single();

    if (userError || !users) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users;

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

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    // Get role-specific data
    let roleData = {};
    if (user.role === 'farmer') {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('farmname, verificationstatus, ratingaverage')
        .eq('userid', user._id)
        .single();
      if (farmerData) {
        roleData = farmerData;
      }
    } else if (user.role === 'consumer') {
      const { data: consumerData } = await supabase
        .from('consumers')
        .select('walletbalance, totalorders')
        .eq('userid', user._id)
        .single();
      if (consumerData) {
        roleData = consumerData;
      }
    } else if (user.role === 'dealer') {
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('businessname, isverified, ratingaverage')
        .eq('userid', user._id)
        .single();
      if (dealerData) {
        roleData = dealerData;
      }
    } else if (user.role === 'expert') {
      const { data: expertData } = await supabase
        .from('experts')
        .select('specialization, isverified, ratingaverage')
        .eq('userid', user._id)
        .single();
      if (expertData) {
        roleData = expertData;
      }
    }

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

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get basic user info from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('_id, name, email, phone, role, isverified, isbanned, profileimageurl, lastloginat, createdat')
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
        .select('farmname, description, farmingtype, deliveryradius, verificationstatus, ratingaverage, totalreviews, totalsales, commissionrate')
        .eq('userid', userId)
        .single();
      if (farmerData) {
        roleData = farmerData;
      }
    } else if (user.role === 'consumer') {
      const { data: consumerData } = await supabase
        .from('consumers')
        .select('defaultaddressstreet, defaultaddresscity, defaultaddressstate, defaultaddresspostalcode, walletbalance, totalorders')
        .eq('userid', userId)
        .single();
      if (consumerData) {
        roleData = consumerData;
      }
    } else if (user.role === 'dealer') {
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .eq('userid', userId)
        .single();
      if (dealerData) {
        roleData = dealerData;
      }
    } else if (user.role === 'expert') {
      const { data: expertData } = await supabase
        .from('experts')
        .select('*')
        .eq('userid', userId)
        .single();
      if (expertData) {
        roleData = expertData;
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

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, phone, profileImageUrl, ...roleSpecificData } = req.body;

    // Update basic user info using Supabase
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImageUrl !== undefined) updateData.profileimageurl = profileImageUrl;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('_id', userId);

      if (updateError) throw updateError;
    }

    // Update role-specific data
    if (req.user.role === 'farmer') {
      const { farmName, description, farmingType, deliveryRadius } = roleSpecificData;
      const farmerUpdateData = {};
      if (farmName) farmerUpdateData.farmname = farmName;
      if (description !== undefined) farmerUpdateData.description = description;
      if (farmingType) farmerUpdateData.farmingtype = farmingType;
      if (deliveryRadius !== undefined) farmerUpdateData.deliveryradius = deliveryRadius;

      if (Object.keys(farmerUpdateData).length > 0) {
        const { error: farmerError } = await supabase
          .from('farmers')
          .update(farmerUpdateData)
          .eq('userid', userId);

        if (farmerError) throw farmerError;
      }
    } else if (req.user.role === 'consumer') {
      const { defaultAddress } = roleSpecificData;
      
      if (defaultAddress) {
        const consumerUpdateData = {};
        if (defaultAddress.street !== undefined) consumerUpdateData.defaultaddressstreet = defaultAddress.street;
        if (defaultAddress.city !== undefined) consumerUpdateData.defaultaddresscity = defaultAddress.city;
        if (defaultAddress.state !== undefined) consumerUpdateData.defaultaddressstate = defaultAddress.state;
        if (defaultAddress.postalCode !== undefined) consumerUpdateData.defaultaddresspostalcode = defaultAddress.postalCode;
        if (defaultAddress.location) consumerUpdateData.defaultaddresslocation = defaultAddress.location;

        if (Object.keys(consumerUpdateData).length > 0) {
          const { error: consumerError } = await supabase
            .from('consumers')
            .update(consumerUpdateData)
            .eq('userid', userId);

          if (consumerError) throw consumerError;
        }
      }
    } else if (req.user.role === 'dealer') {
      const { 
        businessName, businessType, licenseNumber, businessAddress, 
        businessCity, businessState, businessPostalCode, businessPhone, 
        businessEmail, description, minimumOrderQuantity, serviceDeliveryRadius,
        preferredCrops, paymentTerms 
      } = roleSpecificData;

      const dealerUpdateData = {};
      if (businessName) dealerUpdateData.businessname = businessName;
      if (businessType) dealerUpdateData.businesstype = businessType;
      if (licenseNumber) dealerUpdateData.licensenumber = licenseNumber;
      if (businessAddress) dealerUpdateData.businessaddress = businessAddress;
      if (businessCity) dealerUpdateData.businesscity = businessCity;
      if (businessState) dealerUpdateData.businessstate = businessState;
      if (businessPostalCode) dealerUpdateData.businesspostalcode = businessPostalCode;
      if (businessPhone) dealerUpdateData.businessphone = businessPhone;
      if (businessEmail) dealerUpdateData.businessemail = businessEmail;
      if (description !== undefined) dealerUpdateData.description = description;
      if (minimumOrderQuantity !== undefined) dealerUpdateData.minimumorderquantity = minimumOrderQuantity;
      if (serviceDeliveryRadius !== undefined) dealerUpdateData.servicedeliveryradius = serviceDeliveryRadius;
      if (preferredCrops !== undefined) dealerUpdateData.preferredcrops = preferredCrops;
      if (paymentTerms) dealerUpdateData.paymentterms = paymentTerms;

      if (Object.keys(dealerUpdateData).length > 0) {
        const { error: dealerError } = await supabase
          .from('dealers')
          .update(dealerUpdateData)
          .eq('userid', userId);

        if (dealerError) throw dealerError;
      }
    } else if (req.user.role === 'expert') {
      const { 
        specialization, expertiseLevel, qualifications, experienceYears, 
        consultationFee, availabilityStatus, consultationHours, languages, description 
      } = roleSpecificData;

      const expertUpdateData = {};
      if (specialization) expertUpdateData.specialization = specialization;
      if (expertiseLevel) expertUpdateData.expertiselevel = expertiseLevel;
      if (qualifications !== undefined) expertUpdateData.qualifications = qualifications;
      if (experienceYears !== undefined) expertUpdateData.experienceyears = experienceYears;
      if (consultationFee !== undefined) expertUpdateData.consultationfee = consultationFee;
      if (availabilityStatus) expertUpdateData.availabilitystatus = availabilityStatus;
      if (consultationHours !== undefined) expertUpdateData.consultationhours = consultationHours;
      if (languages !== undefined) expertUpdateData.languages = languages;
      if (description !== undefined) expertUpdateData.description = description;

      if (Object.keys(expertUpdateData).length > 0) {
        const { error: expertError } = await supabase
          .from('experts')
          .update(expertUpdateData)
          .eq('userid', userId);

        if (expertError) throw expertError;
      }
    }

    logger.info(`Profile updated for user: ${req.user.email}`);

    // Get updated profile
    return getProfile(req, res, next);

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
