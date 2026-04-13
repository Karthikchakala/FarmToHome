const { createClient } = require('@supabase/supabase-js');

class FieldService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  normalizeUserId(userId) {
    return userId || null;
  }

  async createField(userId, fieldData) {
    try {
      const normalizedUserId = this.normalizeUserId(userId);
      if (!normalizedUserId) {
        return {
          success: false,
          message: 'Authenticated user id is required to create a field'
        };
      }

      const area = Number(fieldData.area);
      if (!Number.isFinite(area) || area <= 0) {
        return {
          success: false,
          message: 'Field area must be a valid number greater than 0'
        };
      }

      const { data, error } = await this.supabase
        .from('fields')
        .insert({
          user_id: normalizedUserId,
          name: fieldData.name,
          area,
          location: fieldData.location,
          soil_type: fieldData.soilType,
          current_crop: fieldData.currentCrop,
          planting_date: fieldData.plantingDate,
          notes: fieldData.notes
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        field: data
      };
    } catch (error) {
      console.error('Create Field Error:', error.message);
      return {
        success: false,
        message: 'Failed to create field',
        error: error.message
      };
    }
  }

  async getUserFields(userId) {
    try {
      const { data, error } = await this.supabase
        .from('fields')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        fields: data
      };
    } catch (error) {
      console.error('Get Fields Error:', error.message);
      return {
        success: false,
        message: 'Failed to fetch fields',
        error: error.message
      };
    }
  }

  async updateField(userId, fieldId, updateData) {
    try {
      const normalizedUserId = this.normalizeUserId(userId);
      if (!normalizedUserId) {
        return {
          success: false,
          message: 'Authenticated user id is required to update a field'
        };
      }

      const { data, error } = await this.supabase
        .from('fields')
        .update(updateData)
        .eq('id', fieldId)
        .eq('user_id', normalizedUserId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        field: data
      };
    } catch (error) {
      console.error('Update Field Error:', error.message);
      return {
        success: false,
        message: 'Failed to update field',
        error: error.message
      };
    }
  }

  async deleteField(userId, fieldId) {
    try {
      const normalizedUserId = this.normalizeUserId(userId);
      if (!normalizedUserId) {
        return {
          success: false,
          message: 'Authenticated user id is required to delete a field'
        };
      }

      const { error } = await this.supabase
        .from('fields')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', normalizedUserId);

      if (error) throw error;

      return {
        success: true,
        message: 'Field deleted successfully'
      };
    } catch (error) {
      console.error('Delete Field Error:', error.message);
      return {
        success: false,
        message: 'Failed to delete field',
        error: error.message
      };
    }
  }
}

module.exports = new FieldService();
