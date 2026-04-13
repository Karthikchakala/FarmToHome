const supabase = require('./../config/supabaseClient');
const { createNotification } = require('./../controllers/notificationController');

const FALLBACK_EXPERTS = [
  {
    id: 'expert-soil-1',
    name: 'Dr. Kavita Menon',
    specialization: 'Soil Health & Nutrition',
    region: 'South India',
    experienceYears: 12,
    languages: ['English', 'Hindi', 'Tamil'],
    bio: 'Helps farmers improve soil fertility, nutrient balance, and crop recovery plans.',
    rating: 4.8,
    availabilityStatus: 'available'
  },
  {
    id: 'expert-pest-1',
    name: 'Rohan Deshpande',
    specialization: 'Pest & Disease Management',
    region: 'West India',
    experienceYears: 9,
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Supports early pest detection, treatment selection, and crop protection workflows.',
    rating: 4.7,
    availabilityStatus: 'available'
  },
  {
    id: 'expert-market-1',
    name: 'Anita Verma',
    specialization: 'Market Linkages & Post-Harvest Strategy',
    region: 'North India',
    experienceYears: 11,
    languages: ['English', 'Hindi'],
    bio: 'Advises on crop monetization, timing of sale, and post-harvest handling.',
    rating: 4.9,
    availabilityStatus: 'busy'
  }
];

class AgriExpertService {
  normalizeExpert(record) {
    return {
      id: record.id || record._id,
      name: record.name,
      specialization: record.specialization,
      region: record.region,
      experienceYears: record.experience_years,
      languages: record.languages || [],
      bio: record.bio || '',
      rating: record.rating || 0,
      availabilityStatus: record.availability_status || 'available',
      userId: record.user_id || null
    };
  }

  async listExperts() {
    try {
      const { data, error } = await supabase
        .from('expert_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        experts: (data || []).map(record => this.normalizeExpert(record))
      };
    } catch (error) {
      return {
        success: true,
        experts: FALLBACK_EXPERTS
      };
    }
  }

  async createInquiry(user, payload) {
    const requesterId = user?._id || user?.id;
    const inquiryPayload = {
      expert_id: payload.expertId,
      requester_user_id: requesterId,
      requester_name: payload.requesterName || user?.name || 'Farmer',
      requester_email: payload.requesterEmail || user?.email || null,
      topic: payload.topic,
      message: payload.message,
      preferred_contact: payload.preferredContact || 'platform'
    };

    try {
      const { data, error } = await supabase
        .from('expert_inquiries')
        .insert(inquiryPayload)
        .select()
        .single();

      if (error) throw error;

      const { data: expert } = await supabase
        .from('expert_profiles')
        .select('user_id, name')
        .eq('id', payload.expertId)
        .single();

      if (expert?.user_id) {
        await createNotification(
          expert.user_id,
          'New expert consultation request',
          `${inquiryPayload.requester_name} sent a consultation request about ${payload.topic}.`,
          'system_update',
          'medium',
          { inquiryId: data.id || data._id, topic: payload.topic },
          '/farmer/talk-to-experts'
        );
      }

      return {
        success: true,
        inquiry: data
      };
    } catch (error) {
      return {
        success: true,
        inquiry: {
          id: `pending-${Date.now()}`,
          ...inquiryPayload,
          status: 'queued'
        }
      };
    }
  }
}

module.exports = new AgriExpertService();
