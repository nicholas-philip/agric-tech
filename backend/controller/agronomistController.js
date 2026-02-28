import Recommendation from '../model/Recommendation.js';
import Farm from '../model/Farm.js';
import Activity from '../model/Activity.js';

// @desc    Create recommendation
// @route   POST /api/agronomist/recommendations
// @access  Private (Agronomist)
const createRecommendation = async (req, res, next) => {
  try {
    const {
      farmer,
      farm,
      category,
      priority,
      recommendationText,
      expectedOutcome,
      followUpDate,
      images
    } = req.body;

    // Verify farm exists
    if (farm) {
      const farmDoc = await Farm.findById(farm);
      if (!farmDoc) {
        return res.status(404).json({
          success: false,
          message: 'Farm not found'
        });
      }
    }

    const recommendation = await Recommendation.create({
      agronomist: req.user.id,
      farmer,
      farm,
      category,
      priority,
      recommendationText,
      expectedOutcome,
      followUpDate,
      images
    });

    res.status(201).json({
      success: true,
      message: 'Recommendation created successfully',
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all recommendations made by agronomist
// @route   GET /api/agronomist/recommendations/my
// @access  Private (Agronomist)
const getMyRecommendations = async (req, res, next) => {
  try {
    const { status, priority, farmer } = req.query;

    let query = { agronomist: req.user.id };

    if (status) query.implementationStatus = status;
    if (priority) query.priority = priority;
    if (farmer) query.farmer = farmer;

    const recommendations = await Recommendation.find(query)
      .populate('farmer', 'name phone')
      .populate('farm', 'farmName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendations for a specific farmer
// @route   GET /api/agronomist/recommendations/farmer/:farmerId
// @access  Private (Agronomist, Farmer viewing own)
const getFarmerRecommendations = async (req, res, next) => {
  try {
    // Farmers can only view their own recommendations
    if (req.user.role === 'farmer' && req.params.farmerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these recommendations'
      });
    }

    const recommendations = await Recommendation.find({ farmer: req.params.farmerId })
      .populate('agronomist', 'name phone specialization')
      .populate('farm', 'farmName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recommendation
// @route   PUT /api/agronomist/recommendations/:id
// @access  Private (Agronomist who created it)
const updateRecommendation = async (req, res, next) => {
  try {
    let recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Only agronomist who created it can update
    if (recommendation.agronomist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recommendation'
      });
    }

    recommendation = await Recommendation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Recommendation updated successfully',
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Farmer updates implementation status or provides feedback
// @route   PUT /api/agronomist/recommendations/:id/feedback
// @access  Private (Farmer)
const updateFarmerFeedback = async (req, res, next) => {
  try {
    const { implementationStatus, farmerFeedback, isImplemented } = req.body;

    let recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Only the farmer for whom recommendation was made can update
    if (recommendation.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recommendation'
      });
    }

    const updates = {};
    if (implementationStatus) updates.implementationStatus = implementationStatus;
    if (farmerFeedback) updates.farmerFeedback = farmerFeedback;
    if (typeof isImplemented === 'boolean') updates.isImplemented = isImplemented;

    recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer farms (for agronomist inspection)
// @route   GET /api/agronomist/farmers/:farmerId/farms
// @access  Private (Agronomist)
const getFarmerFarms = async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.params.farmerId, isActive: true })
      .populate('farmer', 'name phone location');

    res.status(200).json({
      success: true,
      count: farms.length,
      data: farms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farm activities (for agronomist inspection)
// @route   GET /api/agronomist/farms/:farmId/activities
// @access  Private (Agronomist)
const getFarmActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ farm: req.params.farmId })
      .populate('loggedBy', 'name role')
      .sort('-date')
      .limit(50);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

export {
  createRecommendation,
  getMyRecommendations,
  getFarmerRecommendations,
  updateRecommendation,
  updateFarmerFeedback,
  getFarmerFarms,
  getFarmActivities
};
