const supabase = require('./../config/supabaseClient');

class AgriFieldManagementService {
  isMissingColumnError(error) {
    const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
    return error?.code === '42703' || message.includes('does not exist') || message.includes('column');
  }

  normalizeRecord(record) {
    return {
      id: record.id,
      name: record.name,
      area: record.area,
      location: record.location,
      soilType: record.soil_type || '',
      soilPh: record.soil_ph,
      nitrogen: record.nitrogen,
      phosphorus: record.phosphorus,
      potassium: record.potassium,
      waterSource: record.water_source || '',
      currentCrop: record.current_crop || '',
      cropStatus: record.crop_status || 'planned',
      plantingDate: record.planting_date,
      expectedHarvestDate: record.expected_harvest_date,
      notes: record.notes || '',
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  buildPayload(fieldData) {
    const area = Number(fieldData.area);
    const soilPh = fieldData.soilPh === '' || fieldData.soilPh === null || fieldData.soilPh === undefined
      ? null
      : Number(fieldData.soilPh);

    return {
      name: fieldData.name,
      area,
      location: fieldData.location,
      soil_type: fieldData.soilType || null,
      soil_ph: Number.isFinite(soilPh) ? soilPh : null,
      nitrogen: fieldData.nitrogen === '' || fieldData.nitrogen === null || fieldData.nitrogen === undefined ? null : Number(fieldData.nitrogen),
      phosphorus: fieldData.phosphorus === '' || fieldData.phosphorus === null || fieldData.phosphorus === undefined ? null : Number(fieldData.phosphorus),
      potassium: fieldData.potassium === '' || fieldData.potassium === null || fieldData.potassium === undefined ? null : Number(fieldData.potassium),
      water_source: fieldData.waterSource || null,
      current_crop: fieldData.currentCrop || null,
      crop_status: fieldData.cropStatus || 'planned',
      planting_date: fieldData.plantingDate || null,
      expected_harvest_date: fieldData.expectedHarvestDate || null,
      notes: fieldData.notes || null
    };
  }

  buildLegacyPayload(fieldData) {
    const area = Number(fieldData.area);
    return {
      name: fieldData.name,
      area,
      location: fieldData.location,
      soil_type: fieldData.soilType || null,
      current_crop: fieldData.currentCrop || null,
      planting_date: fieldData.plantingDate || null,
      notes: fieldData.notes || null
    };
  }

  async createField(userId, fieldData) {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'Authenticated user id is required to create a field'
        };
      }

      if (!fieldData?.name || !fieldData?.location) {
        return {
          success: false,
          message: 'Field name and location are required'
        };
      }

      const payload = this.buildPayload(fieldData);
      if (!Number.isFinite(payload.area) || payload.area <= 0) {
        return {
          success: false,
          message: 'Field area must be a valid number greater than 0'
        };
      }

      let inserted = await supabase
        .from('fields')
        .insert({
          user_id: userId,
          ...payload
        })
        .select()
        .single();

      if (inserted.error && this.isMissingColumnError(inserted.error)) {
        console.log('Field create insert failed on smart payload, retrying legacy payload', {
          code: inserted.error.code,
          message: inserted.error.message,
          details: inserted.error.details,
          hint: inserted.error.hint,
          payload
        });
        console.warn('Field create fallback to legacy payload', {
          message: inserted.error.message,
          details: inserted.error.details,
          hint: inserted.error.hint
        });
        inserted = await supabase
          .from('fields')
          .insert({
            user_id: userId,
            ...this.buildLegacyPayload(fieldData)
          })
          .select()
          .single();
      }

      const { data, error } = inserted;
      if (error) {
        console.log('Field create insert error', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          payload
        });
        throw error;
      }

      return {
        success: true,
        field: this.normalizeRecord(data)
      };
    } catch (error) {
      console.log('Field create service exception', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return {
        success: false,
        message: 'Failed to create field',
        error: error.message
      };
    }
  }

  async getUserFields(userId) {
    try {
      let query = supabase
        .from('fields')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      let { data, error } = await query;
      if (error && this.isMissingColumnError(error)) {
        console.log('Field list query failed on smart shape, retrying legacy query', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId
        });
        console.warn('Field list fallback without created_at ordering', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        ({ data, error } = await supabase
          .from('fields')
          .select('*')
          .eq('user_id', userId));
      }

      if (error) {
        console.log('Field list query error', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId
        });
        throw error;
      }

      return {
        success: true,
        fields: (data || []).map(record => this.normalizeRecord(record))
      };
    } catch (error) {
      console.log('Field list service exception', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      });
      return {
        success: false,
        message: 'Failed to fetch fields',
        error: error.message
      };
    }
  }

  async updateField(userId, fieldId, updateData) {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'Authenticated user id is required to update a field'
        };
      }

      const payload = this.buildPayload(updateData);
      let updated = await supabase
        .from('fields')
        .update(payload)
        .eq('id', fieldId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updated.error && this.isMissingColumnError(updated.error)) {
        console.log('Field update failed on smart payload, retrying legacy payload', {
          code: updated.error.code,
          message: updated.error.message,
          details: updated.error.details,
          hint: updated.error.hint,
          fieldId,
          userId,
          payload
        });
        console.warn('Field update fallback to legacy payload', {
          message: updated.error.message,
          details: updated.error.details,
          hint: updated.error.hint
        });
        updated = await supabase
          .from('fields')
          .update(this.buildLegacyPayload(updateData))
          .eq('id', fieldId)
          .eq('user_id', userId)
          .select()
          .single();
      }

      const { data, error } = updated;
      if (error) {
        console.log('Field update query error', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fieldId,
          userId,
          payload
        });
        throw error;
      }

      return {
        success: true,
        field: this.normalizeRecord(data)
      };
    } catch (error) {
      console.log('Field update service exception', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fieldId,
        userId
      });
      return {
        success: false,
        message: 'Failed to update field',
        error: error.message
      };
    }
  }

  async deleteField(userId, fieldId) {
    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', fieldId)
        .eq('user_id', userId);

      if (error) {
        console.log('Field delete query error', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fieldId,
          userId
        });
        throw error;
      }

      return {
        success: true,
        message: 'Field deleted successfully'
      };
    } catch (error) {
      console.log('Field delete service exception', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fieldId,
        userId
      });
      return {
        success: false,
        message: 'Failed to delete field',
        error: error.message
      };
    }
  }
}

module.exports = new AgriFieldManagementService();
