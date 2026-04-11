// Supabase Database Service
// This service provides a wrapper around Supabase client for database operations
const supabase = require('../config/supabaseClient');

class SupabaseDB {
  constructor() {
    this.client = supabase;
  }

  // Generic query method for Supabase
  async query(table, options = {}) {
    try {
      let query = this.client.from(table);
      
      // Apply filters
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Supabase DB service error:', error);
      throw error;
    }
  }

  // Insert method
  async insert(table, data) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  }

  // Update method
  async update(table, data, where) {
    try {
      let query = this.client.from(table).update(data);
      
      // Apply where conditions
      if (where) {
        Object.keys(where).forEach(key => {
          query = query.eq(key, where[key]);
        });
      }
      
      const { data: result, error } = await query.select();
      
      if (error) {
        throw new Error(`Supabase update error: ${error.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  }

  // Delete method
  async delete(table, where) {
    try {
      let query = this.client.from(table).delete();
      
      // Apply where conditions
      if (where) {
        Object.keys(where).forEach(key => {
          query = query.eq(key, where[key]);
        });
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }

  // Raw SQL execution (for complex queries)
  async rpc(functionName, params = {}) {
    try {
      const { data, error } = await this.client.rpc(functionName, params);
      
      if (error) {
        throw new Error(`Supabase RPC error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .single();
      
      if (error) {
        throw new Error(`Supabase health check failed: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error('Supabase health check error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const supabaseDB = new SupabaseDB();
module.exports = supabaseDB;
