const bcrypt = require('bcryptjs');
const { query, transaction } = require('../db');
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
    if (!['farmer', 'consumer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be farmer, consumer, or admin'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Use transaction for user creation
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (name, email, phone, passwordhash, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING _id, name, email, role, isverified, isbanned, createdat`,
        [name, email, phone, passwordHash, role]
      );

      const user = userResult.rows[0];

      // Insert role-specific data
      if (role === 'farmer') {
        const { farmName, description, farmingType, location, deliveryRadius } = roleSpecificData;
        
        if (!farmName) {
          throw new Error('Farm name is required for farmer registration');
        }

        await client.query(
          `INSERT INTO farmers (userid, farmname, description, farmingtype, location, deliveryradius, verificationstatus, isapproved) 
           VALUES ($1, $2, $3, $4, ST_GeographyFromText('SRID=4326;POINT(' || $5 || ' ' || $6 || ')'), $7, $8, $9)`,
          [user._id, farmName, description || null, farmingType || 'mixed', 
           location?.longitude || 0, location?.latitude || 0, deliveryRadius || 5000, 'pending', false]
        );
      } else if (role === 'consumer') {
        const { defaultAddress } = roleSpecificData;
        
        if (defaultAddress) {
          await client.query(
            `INSERT INTO consumers (userid, defaultaddressstreet, defaultaddresscity, 
             defaultaddressstate, defaultaddresspostalcode, defaultaddresslocation) 
             VALUES ($1, $2, $3, $4, $5, ST_GeographyFromText('SRID=4326;POINT(' || $6 || ' ' || $7 || ')'))`,
            [user._id, defaultAddress.street, defaultAddress.city, defaultAddress.state,
             defaultAddress.postalCode, defaultAddress.location?.longitude || 0, 
             defaultAddress.location?.latitude || 0]
          );
        } else {
          await client.query(
            'INSERT INTO consumers (userid) VALUES ($1)',
            [user._id]
          );
        }
      }

      return user;
    });

    // Generate JWT token
    const token = generateToken({ userId: result._id, role: result.role });

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
          id: result._id,
          name: result.name,
          email: result.email,
          role: result.role,
          isVerified: result.isverified,
          isBanned: result.isbanned,
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

    // Get user from database
    const result = await query(
      `SELECT _id, name, email, phone, passwordhash, role, isverified, isbanned, lastloginat 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

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
    await query(
      'UPDATE users SET lastloginat = CURRENT_TIMESTAMP WHERE _id = $1',
      [user._id]
    );

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    // Get role-specific data
    let roleData = {};
    if (user.role === 'farmer') {
      const farmerResult = await query(
        'SELECT farmname, verificationstatus, ratingaverage FROM farmers WHERE userid = $1',
        [user._id]
      );
      if (farmerResult.rows.length > 0) {
        roleData = farmerResult.rows[0];
      }
    } else if (user.role === 'consumer') {
      const consumerResult = await query(
        'SELECT walletbalance, totalorders FROM consumers WHERE userid = $1',
        [user._id]
      );
      if (consumerResult.rows.length > 0) {
        roleData = consumerResult.rows[0];
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

    // Get basic user info
    const userResult = await query(
      `SELECT _id, name, email, phone, role, isverified, isbanned, profileimageurl, 
       lastloginat, createdat FROM users WHERE _id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    let roleData = {};
    if (user.role === 'farmer') {
      const farmerResult = await query(
        `SELECT farmname, description, farmingtype, deliveryradius, verificationstatus,
         ratingaverage, totalreviews, totalsales, commissionrate 
         FROM farmers WHERE userid = $1`,
        [userId]
      );
      if (farmerResult.rows.length > 0) {
        roleData = farmerResult.rows[0];
      }
    } else if (user.role === 'consumer') {
      const consumerResult = await query(
        `SELECT defaultaddressstreet, defaultaddresscity, defaultaddressstate,
         defaultaddresspostalcode, walletbalance, totalorders 
         FROM consumers WHERE userid = $1`,
        [userId]
      );
      if (consumerResult.rows.length > 0) {
        roleData = consumerResult.rows[0];
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

    // Use transaction for update
    await transaction(async (client) => {
      // Update basic user info
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(name);
      }
      if (phone) {
        updateFields.push(`phone = $${paramCount++}`);
        updateValues.push(phone);
      }
      if (profileImageUrl !== undefined) {
        updateFields.push(`profileimageurl = $${paramCount++}`);
        updateValues.push(profileImageUrl);
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE _id = $${paramCount}`,
          updateValues
        );
      }

      // Update role-specific data
      if (req.user.role === 'farmer') {
        const { farmName, description, farmingType, deliveryRadius } = roleSpecificData;
        const farmerUpdateFields = [];
        const farmerUpdateValues = [];
        paramCount = 1;

        if (farmName) {
          farmerUpdateFields.push(`farmname = $${paramCount++}`);
          farmerUpdateValues.push(farmName);
        }
        if (description !== undefined) {
          farmerUpdateFields.push(`description = $${paramCount++}`);
          farmerUpdateValues.push(description);
        }
        if (farmingType) {
          farmerUpdateFields.push(`farmingtype = $${paramCount++}`);
          farmerUpdateValues.push(farmingType);
        }
        if (deliveryRadius !== undefined) {
          farmerUpdateFields.push(`deliveryradius = $${paramCount++}`);
          farmerUpdateValues.push(deliveryRadius);
        }

        if (farmerUpdateFields.length > 0) {
          farmerUpdateValues.push(userId);
          await client.query(
            `UPDATE farmers SET ${farmerUpdateFields.join(', ')} WHERE userid = $${paramCount}`,
            farmerUpdateValues
          );
        }
      } else if (req.user.role === 'consumer') {
        const { defaultAddress } = roleSpecificData;
        
        if (defaultAddress) {
          const consumerUpdateFields = [];
          const consumerUpdateValues = [];
          let paramCount = 1;

          if (defaultAddress.street !== undefined) {
            consumerUpdateFields.push(`defaultaddressstreet = $${paramCount++}`);
            consumerUpdateValues.push(defaultAddress.street);
          }
          if (defaultAddress.city !== undefined) {
            consumerUpdateFields.push(`defaultaddresscity = $${paramCount++}`);
            consumerUpdateValues.push(defaultAddress.city);
          }
          if (defaultAddress.state !== undefined) {
            consumerUpdateFields.push(`defaultaddressstate = $${paramCount++}`);
            consumerUpdateValues.push(defaultAddress.state);
          }
          if (defaultAddress.postalCode !== undefined) {
            consumerUpdateFields.push(`defaultaddresspostalcode = $${paramCount++}`);
            consumerUpdateValues.push(defaultAddress.postalCode);
          }
          if (defaultAddress.location) {
            consumerUpdateFields.push(`defaultaddresslocation = ST_Point($${paramCount}, $${paramCount + 1}, 4326)`);
            consumerUpdateValues.push(defaultAddress.location.longitude, defaultAddress.location.latitude);
            paramCount += 2;
          }

          if (consumerUpdateFields.length > 0) {
            consumerUpdateValues.push(userId);
            await client.query(
              `UPDATE consumers SET ${consumerUpdateFields.join(', ')} WHERE userid = $${paramCount}`,
              consumerUpdateValues
            );
          }
        }
      }
    });

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
