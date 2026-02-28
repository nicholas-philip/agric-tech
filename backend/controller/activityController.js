import Activity from '../model/Activity.js';
import Farm from '../model/Farm.js';
import CreditProfile from '../model/CreditProfile.js';

// @desc    Log farm activity
// @route   POST /api/activities
// @access  Private (Farmer, Agent)
const logActivity = async (req, res, next) => {
  try {
    const { farmer, farm, crop, activityType, season, inputUsed, quantity, date, notes } = req.body;

    // If user is agent, they can log for assigned farmers
    // If user is farmer, they can only log for themselves
    let farmerId = req.user.role === 'farmer' ? req.user.id : farmer;

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: 'Farmer reference is required'
      });
    }

    // Verify farm belongs to farmer
    const farmDoc = await Farm.findById(farm);
    if (!farmDoc) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    if (farmDoc.farmer.toString() !== farmerId) {
      return res.status(403).json({
        success: false,
        message: 'Farm does not belong to specified farmer'
      });
    }

    const activity = await Activity.create({
      farmer: farmerId,
      farm,
      loggedBy: req.user.id,
      crop,
      activityType,
      season,
      inputUsed,
      quantity,
      date: date || Date.now(),
      notes
    });

    // Update credit profile
    await updateActivityMetrics(farmerId);

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activities for logged-in farmer
// @route   GET /api/activities/my
// @access  Private (Farmer)
const getMyActivities = async (req, res, next) => {
  try {
    const { activityType, season, farm, startDate, endDate } = req.query;

    let query = { farmer: req.user.id };

    if (activityType) query.activityType = activityType;
    if (season) query.season = season;
    if (farm) query.farm = farm;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('farm', 'farmName')
      .populate('loggedBy', 'name role')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activities by farm
// @route   GET /api/activities/farm/:farmId
// @access  Private
const getActivitiesByFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findById(req.params.farmId);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check permissions
    if (req.user.role === 'farmer' && farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these activities'
      });
    }

    const activities = await Activity.find({ farm: req.params.farmId })
      .populate('loggedBy', 'name role')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('farmer', 'name phone')
      .populate('farm', 'farmName')
      .populate('loggedBy', 'name role');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (req.user.role === 'farmer' && activity.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this activity'
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Farmer, Agent who logged it)
const updateActivity = async (req, res, next) => {
  try {
    let activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (activity.loggedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this activity'
      });
    }

    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Farmer, Agent who logged it)
const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (activity.loggedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity'
      });
    }

    await activity.deleteOne();

    // Update credit profile
    await updateActivityMetrics(activity.farmer);

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update activity metrics in credit profile
async function updateActivityMetrics(farmerId) {
  try {
    const activities = await Activity.find({ farmer: farmerId });
    
    const creditProfile = await CreditProfile.findOne({ farmer: farmerId });
    
    if (!creditProfile) return;

    creditProfile.totalActivitiesLogged = activities.length;
    
    if (activities.length > 0) {
      creditProfile.lastActivityDate = activities.sort((a, b) => b.date - a.date)[0].date;
      
      // Calculate activity consistency
      const firstActivity = activities.sort((a, b) => a.date - b.date)[0];
      const daysActive = Math.ceil((Date.now() - firstActivity.date) / (1000 * 60 * 60 * 24));
      creditProfile.calculateActivityConsistency(activities.length, daysActive);
    }

    // Update harvest history for harvesting activities
    const harvestActivities = activities.filter(a => a.activityType === 'harvesting');
    creditProfile.harvestHistory = harvestActivities.map(a => ({
      crop: a.crop,
      quantity: a.quantity?.value || 0,
      unit: a.quantity?.unit || 'kg',
      season: a.season,
      year: new Date(a.date).getFullYear(),
      date: a.date
    }));

    creditProfile.totalHarvestVolume = harvestActivities.reduce((sum, a) => sum + (a.quantity?.value || 0), 0);

    // Recalculate trust score
    creditProfile.calculateTrustScore();
    creditProfile.updateCreditworthinessRating();
    creditProfile.lastUpdated = Date.now();

    await creditProfile.save();
  } catch (error) {
    console.error('Error updating activity metrics:', error);
  }
}

export {
  logActivity,
  getMyActivities,
  getActivitiesByFarm,
  getActivity,
  updateActivity,
  deleteActivity
};
