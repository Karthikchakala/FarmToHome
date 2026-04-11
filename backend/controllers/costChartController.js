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

// Get cost chart for farmer reference (read-only)
const getCostChartForReference = async (req, res) => {
  try {
    console.log('DEBUG: getCostChartForReference called');
    console.log('DEBUG: User:', req.user);
    console.log('DEBUG: User role:', req.user?.role);
    
    const { page = 1, limit = 100, category, is_active } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('vegetable_cost_chart')
      .select('*')
      .eq('is_active', true) // Only show active pricing
      .order('vegetable_name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: costChart, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.log('DEBUG: Supabase error:', error);
      logger.error('Error fetching cost chart for reference:', error);
      return responseHelper.error(res, 'Failed to fetch cost chart reference', 500);
    }

    console.log('DEBUG: Cost chart data fetched:', costChart?.length || 0, 'items');

    const pages = Math.ceil((count || 0) / limit);

    responseHelper.success(res, {
      costChart,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    }, 'Cost chart reference fetched successfully');

  } catch (error) {
    console.log('DEBUG: Exception in getCostChartForReference:', error);
    logger.error('Error in getCostChartForReference:', error);
    responseHelper.error(res, 'Internal server error', 500);
  }
};

// Get all vegetable cost chart entries
const getCostChart = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, is_active } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('vegetable_cost_chart')
      .select('*')
      .order('vegetable_name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: costChart, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching cost chart:', error);
      return responseHelper.error(res, 'Failed to fetch cost chart', 500);
    }

    return responseHelper.success(res, {
      costChart,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    logger.error('Error in getCostChart:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Get single vegetable cost chart entry
const getCostChartEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: entry, error } = await supabase
      .from('vegetable_cost_chart')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return responseHelper.error(res, 'Cost chart entry not found', 404);
      }
      logger.error('Error fetching cost chart entry:', error);
      return responseHelper.error(res, 'Failed to fetch cost chart entry', 500);
    }

    return responseHelper.success(res, { entry });

  } catch (error) {
    logger.error('Error in getCostChartEntry:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Create new vegetable cost chart entry
const createCostChartEntry = async (req, res) => {
  try {
    const { vegetable_name, category, base_price, unit } = req.body;
    const createdBy = req.user._id;

    // Validation
    if (!vegetable_name || !base_price || !unit) {
      return responseHelper.error(res, 'Vegetable name, base price, and unit are required', 400);
    }

    if (base_price <= 0) {
      return responseHelper.error(res, 'Base price must be greater than 0', 400);
    }

    const validUnits = ['kg', 'gram', 'litre', 'piece'];
    if (!validUnits.includes(unit)) {
      return responseHelper.error(res, 'Invalid unit. Must be one of: kg, gram, litre, piece', 400);
    }

    // Generate UUID manually to ensure it's created
    const { randomUUID } = require('crypto');
    
    const { data: entry, error } = await supabase
      .from('vegetable_cost_chart')
      .insert({
        _id: randomUUID(), // Generate UUID manually using Node.js crypto
        vegetable_name: vegetable_name.toLowerCase().trim(),
        category: category || 'vegetables',
        base_price,
        unit,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return responseHelper.error(res, 'Vegetable already exists in cost chart', 409);
      }
      logger.error('Error creating cost chart entry:', error);
      return responseHelper.error(res, 'Failed to create cost chart entry', 500);
    }

    logger.info(`Cost chart entry created: ${vegetable_name} by admin ${createdBy}`);
    return responseHelper.created(res, { entry });

  } catch (error) {
    logger.error('Error in createCostChartEntry:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Update vegetable cost chart entry
const updateCostChartEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { vegetable_name, category, base_price, unit, is_active } = req.body;

    // Validation
    if (base_price !== undefined && base_price <= 0) {
      return responseHelper.error(res, 'Base price must be greater than 0', 400);
    }

    if (unit !== undefined) {
      const validUnits = ['kg', 'gram', 'litre', 'piece'];
      if (!validUnits.includes(unit)) {
        return responseHelper.error(res, 'Invalid unit. Must be one of: kg, gram, litre, piece', 400);
      }
    }

    const updateData = {};
    if (vegetable_name) updateData.vegetable_name = vegetable_name.toLowerCase().trim();
    if (category !== undefined) updateData.category = category;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (unit !== undefined) updateData.unit = unit;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updatedat = new Date().toISOString();

    const { data: entry, error } = await supabase
      .from('vegetable_cost_chart')
      .update(updateData)
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return responseHelper.error(res, 'Cost chart entry not found', 404);
      }
      if (error.code === '23505') {
        return responseHelper.error(res, 'Vegetable already exists in cost chart', 409);
      }
      logger.error('Error updating cost chart entry:', error);
      return responseHelper.error(res, 'Failed to update cost chart entry', 500);
    }

    logger.info(`Cost chart entry updated: ${id}`);
    return responseHelper.success(res, { entry });

  } catch (error) {
    logger.error('Error in updateCostChartEntry:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Delete vegetable cost chart entry
const deleteCostChartEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('vegetable_cost_chart')
      .delete()
      .eq('_id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return responseHelper.error(res, 'Cost chart entry not found', 404);
      }
      logger.error('Error deleting cost chart entry:', error);
      return responseHelper.error(res, 'Failed to delete cost chart entry', 500);
    }

    logger.info(`Cost chart entry deleted: ${id}`);
    return responseHelper.success(res, { message: 'Cost chart entry deleted successfully' });

  } catch (error) {
    logger.error('Error in deleteCostChartEntry:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Get vegetable pricing info for farmers
const getVegetablePricing = async (req, res) => {
  try {
    const { vegetable_name } = req.query;

    if (!vegetable_name) {
      return responseHelper.error(res, 'Vegetable name is required', 400);
    }

    const { data: pricing, error } = await supabase
      .from('vegetable_cost_chart')
      .select('*')
      .eq('vegetable_name', vegetable_name.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return responseHelper.error(res, 'No pricing found for this vegetable', 404);
      }
      logger.error('Error fetching vegetable pricing:', error);
      return responseHelper.error(res, 'Failed to fetch pricing', 500);
    }

    return responseHelper.success(res, { 
      pricing: {
        vegetable_name: pricing.vegetable_name,
        category: pricing.category,
        base_price: pricing.base_price,
        min_price: pricing.min_price,
        max_price: pricing.max_price,
        unit: pricing.unit
      }
    });

  } catch (error) {
    logger.error('Error in getVegetablePricing:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
};

// Validate product price against cost chart - allow any product without constraints
const validateProductPrice = async (vegetable_name, price) => {
  try {
    const { data: pricing, error } = await supabase
      .from('vegetable_cost_chart')
      .select('min_price, max_price')
      .eq('vegetable_name', vegetable_name.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    // Always return valid for any product - no price constraints
    if (error || !pricing) {
      return { valid: true, message: 'No pricing constraints found - allowing any price' };
    }

    return { valid: true, message: 'Product price validation passed' };
  } catch (error) {
    logger.error('Error validating product price:', error);
    return { valid: true, message: 'Validation failed, allowing price' };
  }
};

module.exports = {
  getCostChartForReference,
  getCostChart,
  getCostChartEntry,
  createCostChartEntry,
  updateCostChartEntry,
  deleteCostChartEntry,
  getVegetablePricing,
  validateProductPrice
};
