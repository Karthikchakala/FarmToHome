const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');

// Register expert
const registerExpert = asyncHandler(async (req, res) => {
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
  } = req.body;

  const userId = req.user._id;

  // Check if expert profile already exists
  const { data: existingExpert, error: checkError } = await supabase
    .from('experts')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (existingExpert) {
    throw new ValidationError('Expert profile already exists for this user');
  }

  // Create expert profile
  const { data: expert, error: expertError } = await supabase
    .from('experts')
    .insert([{
      userid: userId,
      specialization: specialization,
      expertiselevel: expertiseLevel,
      qualifications: qualifications || [],
      experienceyears: experienceYears || 0,
      consultationfee: consultationFee || 0.00,
      availabilitystatus: availabilityStatus || 'available',
      consultationhours: consultationHours || [],
      languages: languages || ['English'],
      description: description || null
    }])
    .select()
    .single();

  if (expertError) {
    logger.error('Error creating expert profile:', expertError);
    throw new Error('Failed to create expert profile');
  }

  return responseHelper.created(res, expert, 'Expert profile created successfully');
});

// Get expert profile
const getExpertProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { data: expert, error } = await supabase
    .from('experts')
    .select(`
      *,
      users!inner(name, email, phone, profileimageurl)
    `)
    .eq('userid', userId)
    .single();

  if (error || !expert) {
    throw new NotFoundError('Expert profile not found');
  }

  return responseHelper.success(res, expert, 'Expert profile retrieved successfully');
});

// Update expert profile
const updateExpertProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.userid;
  delete updateData._id;
  delete updateData.createdat;
  delete updateData.ratingaverage;
  delete updateData.totalconsultations;
  delete updateData.totalreviews;

  const { data: expert, error } = await supabase
    .from('experts')
    .update(updateData)
    .eq('userid', userId)
    .select()
    .single();

  if (error || !expert) {
    throw new NotFoundError('Expert profile not found or update failed');
  }

  return responseHelper.success(res, expert, 'Expert profile updated successfully');
});

// Get available experts for farmers
const getAvailableExperts = asyncHandler(async (req, res) => {
  const { 
    specialization, 
    expertiseLevel, 
    page = 1, 
    limit = 10 
  } = req.query;

  // First test simple query
  const { data: testExperts, error: testError } = await supabase
    .from('experts')
    .select('*')
    .limit(1);

  console.log('Test query result:', { testExperts, testError });

  if (testError) {
    console.error('Error in test query:', testError);
    return responseHelper.error(res, 'Failed to query experts table', 500);
  }

  let query = supabase
    .from('experts')
    .select(`
      *,
      users!inner(name, email, phone, profileimageurl)
    `);

  // Filter by specialization if specified
  if (specialization) {
    query = query.eq('specialization', specialization);
  }

  // Filter by expertise level if specified
  if (expertiseLevel) {
    query = query.eq('expertiselevel', expertiseLevel);
  }

  query = query.order('ratingaverage', { ascending: false });

  const { data: experts, error } = await query;

  console.log('Main query result:', { experts, error });

  if (error) {
    logger.error('Error fetching experts:', error);
    throw new Error('Failed to fetch available experts');
  }

  console.log('Number of experts found:', experts?.length || 0);

  // Add online status from in-memory tracking
  // For consultations, consider experts online if they're verified and available
  const expertsWithStatus = experts.map(expert => ({
    ...expert,
    online: global.onlineExperts?.has(expert.userid) || expert.isverified || false
  }));

  return responseHelper.success(res, expertsWithStatus, 'Available experts retrieved successfully');
});

// Update expert online status
const updateExpertOnlineStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const userId = req.user._id;

  if (!['online', 'offline'].includes(status)) {
    throw new ValidationError('Invalid status. Must be online or offline');
  }

  // Update in-memory tracking
  if (!global.onlineExperts) {
    global.onlineExperts = new Set();
  }

  if (status === 'online') {
    global.onlineExperts.add(userId);
  } else {
    global.onlineExperts.delete(userId);
  }

  return responseHelper.success(res, { status }, 'Expert online status updated');
});

// Create consultation request
const createConsultation = asyncHandler(async (req, res) => {
  const {
    expertId,
    consultationType,
    title,
    description,
    images,
    scheduledDate,
    durationMinutes = 30,
    consultationMode = 'chat'
  } = req.body;

  const userId = req.user._id;

  // Get farmer profile
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmer) {
    throw new NotFoundError('Farmer profile not found');
  }

  // Get expert details and fee
  const { data: expert, error: expertError } = await supabase
    .from('experts')
    .select('consultationfee, availabilitystatus')
    .eq('_id', expertId)
    .single();

  if (expertError || !expert) {
    throw new NotFoundError('Expert not found');
  }

  if (expert.availabilitystatus !== 'available') {
    throw new ValidationError('Expert is not available for consultation');
  }

  // Create consultation
  const { data: consultation, error: consultationError } = await supabase
    .from('consultations')
    .insert([{
      expertid: expertId,
      farmerid: farmer._id,
      consultationtype: consultationType,
      title: title,
      description: description,
      images: images || [],
      scheduleddate: scheduledDate,
      durationminutes: durationMinutes,
      consultationmode: consultationMode,
      fee: expert.consultationfee
    }])
    .select()
    .single();

  if (consultationError) {
    logger.error('Error creating consultation:', consultationError);
    throw new Error('Failed to create consultation');
  }

  return responseHelper.created(res, consultation, 'Consultation request created successfully');
});

// Get expert's consultations
const getExpertConsultations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  // Get expert profile
  const { data: expert, error: expertError } = await supabase
    .from('experts')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (expertError || !expert) {
    throw new NotFoundError('Expert profile not found');
  }

  let query = supabase
    .from('consultations')
    .select(`
      *,
      farmers!inner(
        users!inner(name, email, phone, profileimageurl)
      )
    `)
    .eq('expertid', expert._id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('createdat', { ascending: false });

  const { data: consultations, error } = await query;

  if (error) {
    logger.error('Error fetching consultations:', error);
    throw new Error('Failed to fetch consultations');
  }

  return responseHelper.success(res, consultations, 'Consultations retrieved successfully');
});

// Get farmer's consultations
const getFarmerConsultations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  // Get farmer profile
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmer) {
    throw new NotFoundError('Farmer profile not found');
  }

  let query = supabase
    .from('consultations')
    .select(`
      *,
      experts!inner(
        users!inner(name, email, phone, profileimageurl),
        specialization,
        expertiselevel,
        consultationfee
      )
    `)
    .eq('farmerid', farmer._id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('createdat', { ascending: false });

  const { data: consultations, error } = await query;

  if (error) {
    logger.error('Error fetching consultations:', error);
    throw new Error('Failed to fetch consultations');
  }

  return responseHelper.success(res, consultations, 'Consultations retrieved successfully');
});

// Update consultation status
const updateConsultationStatus = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  // Check if user is expert or farmer
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('_id', userId)
    .single();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  let query = supabase
    .from('consultations')
    .update({ status });

  if (user.role === 'expert') {
    // Get expert profile
    const { data: expert, error: expertError } = await supabase
      .from('experts')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (expertError || !expert) {
      throw new NotFoundError('Expert profile not found');
    }

    query = query.eq('expertid', expert._id);
  } else if (user.role === 'farmer') {
    // Get farmer profile
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (farmerError || !farmer) {
      throw new NotFoundError('Farmer profile not found');
    }

    query = query.eq('farmerid', farmer._id);
  } else {
    throw new ValidationError('Unauthorized to update consultation');
  }

  const { data: consultation, error } = await query
    .eq('_id', consultationId)
    .select()
    .single();

  if (error || !consultation) {
    throw new NotFoundError('Consultation not found or update failed');
  }

  return responseHelper.success(res, consultation, 'Consultation status updated successfully');
});

// Get consultation messages
const getConsultationMessages = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const userId = req.user._id;

  // Verify user has access to this consultation
  const { data: consultation, error: accessError } = await supabase
    .from('consultations')
    .select(`
      expertid,
      farmerid,
      experts!inner(userid),
      farmers!inner(userid)
    `)
    .eq('_id', consultationId)
    .single();

  if (accessError || !consultation) {
    throw new NotFoundError('Consultation not found');
  }

  if (consultation.experts.userid !== userId && consultation.farmers.userid !== userId) {
    throw new ValidationError('Unauthorized to access this consultation');
  }

  // Get messages
  const { data: messages, error } = await supabase
    .from('consultation_messages')
    .select(`
      *,
      users!consultation_messages_senderid_fkey(name, role)
    `)
    .eq('consultationid', consultationId)
    .order('createdat', { ascending: true });

  if (error) {
    logger.error('Error fetching consultation messages:', error);
    throw new Error('Failed to fetch consultation messages');
  }

  return responseHelper.success(res, messages, 'Consultation messages retrieved successfully');
});

// Send consultation message
const sendConsultationMessage = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const { message, messageType = 'text', fileUrl } = req.body;
  const userId = req.user._id;

  // Verify user has access to this consultation
  const { data: consultation, error: accessError } = await supabase
    .from('consultations')
    .select(`
      expertid,
      farmerid,
      experts!inner(userid),
      farmers!inner(userid)
    `)
    .eq('_id', consultationId)
    .single();

  if (accessError || !consultation) {
    throw new NotFoundError('Consultation not found');
  }

  if (consultation.experts.userid !== userId && consultation.farmers.userid !== userId) {
    throw new ValidationError('Unauthorized to access this consultation');
  }

  // Create message
  const { data: newMessage, error } = await supabase
    .from('consultation_messages')
    .insert([{
      consultationid: consultationId,
      senderid: userId,
      message: message,
      messagetype: messageType,
      fileurl: fileUrl || null
    }])
    .select(`
      *,
      users!consultation_messages_senderid_fkey(name, role)
    `)
    .single();

  if (error) {
    logger.error('Error sending consultation message:', error);
    throw new Error('Failed to send consultation message');
  }

  return responseHelper.created(res, newMessage, 'Message sent successfully');
});

// Send expert suggestion to farmer
const sendExpertSuggestion = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const { suggestion, recommendation, actionItems } = req.body;
  const userId = req.user._id;

  // Verify user is expert and has access to this consultation
  const { data: consultation, error: accessError } = await supabase
    .from('consultations')
    .select(`
      expertid,
      farmers!inner(userid)
    `)
    .eq('_id', consultationId)
    .single();

  if (accessError || !consultation) {
    throw new NotFoundError('Consultation not found');
  }

  // Get expert profile
  const { data: expert, error: expertError } = await supabase
    .from('experts')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (expertError || !expert || expert._id !== consultation.expertid) {
    throw new ValidationError('Unauthorized to send suggestions for this consultation');
  }

  // Create suggestion message
  const suggestionMessage = `💡 EXPERT SUGGESTION:\n\n${suggestion}\n\n${recommendiation ? `📋 Recommendation:\n${recommendation}\n\n` : ''}${actionItems && actionItems.length > 0 ? `✅ Action Items:\n${actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}` : ''}`;

  const { data: newMessage, error } = await supabase
    .from('consultation_messages')
    .insert([{
      consultationid: consultationId,
      senderid: userId,
      message: suggestionMessage,
      messagetype: 'suggestion'
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error sending expert suggestion:', error);
    throw new Error('Failed to send suggestion');
  }

  return responseHelper.created(res, newMessage, 'Suggestion sent successfully');
});

module.exports = {
  registerExpert,
  getExpertProfile,
  updateExpertProfile,
  getAvailableExperts,
  updateExpertOnlineStatus,
  createConsultation,
  getExpertConsultations,
  getFarmerConsultations,
  updateConsultationStatus,
  getConsultationMessages,
  sendConsultationMessage,
  sendExpertSuggestion
};
