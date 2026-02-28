import ClimateProfile from '../model/ClimateProfile.js';
import Farm from '../model/Farm.js';
import CreditProfile from '../model/CreditProfile.js';

// @desc    Create climate profile
// @route   POST /api/climate
// @access  Private (Farmer)
const createClimateProfile = async (req, res, next) => {
  try {
    const {
      farm,
      season,
      year,
      practicesUsed,
      fertilizerUsage,
      irrigationType,
      soilManagementPractice,
      treesPlanted,
      waterUsageEfficiency,
      certifications,
      notes
    } = req.body;

    // Verify farm ownership if farm is provided
    if (farm) {
      const farmDoc = await Farm.findById(farm);
      if (!farmDoc) {
        return res.status(404).json({
          success: false,
          message: 'Farm not found'
        });
      }

      if (farmDoc.farmer.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create climate profile for this farm'
        });
      }
    }

    const climateProfile = await ClimateProfile.create({
      farmer: req.user.id,
      farm,
      season,
      year,
      practicesUsed,
      fertilizerUsage,
      irrigationType,
      soilManagementPractice,
      treesPlanted,
      waterUsageEfficiency,
      certifications,
      notes
    });

    // Calculate compliance score
    climateProfile.calculateComplianceScore();
    await climateProfile.save();

    // Update credit profile with climate score
    await updateClimateScore(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Climate profile created successfully',
      data: climateProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my climate profiles
// @route   GET /api/climate/my
// @access  Private (Farmer)
const getMyClimateProfiles = async (req, res, next) => {
  try {
    const { year, season } = req.query;

    let query = { farmer: req.user.id };

    if (year) query.year = parseInt(year);
    if (season) query.season = season;

    const profiles = await ClimateProfile.find(query)
      .populate('farm', 'farmName')
      .sort('-year -createdAt');

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single climate profile
// @route   GET /api/climate/:id
// @access  Private
const getClimateProfile = async (req, res, next) => {
  try {
    const profile = await ClimateProfile.findById(req.params.id)
      .populate('farmer', 'name phone')
      .populate('farm', 'farmName areaHectares');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Climate profile not found'
      });
    }

    // Check permissions
    if (req.user.role === 'farmer' && profile.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this climate profile'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update climate profile
// @route   PUT /api/climate/:id
// @access  Private (Farmer)
const updateClimateProfile = async (req, res, next) => {
  try {
    let profile = await ClimateProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Climate profile not found'
      });
    }

    // Check ownership
    if (profile.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this climate profile'
      });
    }

    profile = await ClimateProfile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Recalculate compliance score
    profile.calculateComplianceScore();
    await profile.save();

    // Update credit profile
    await updateClimateScore(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Climate profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete climate profile
// @route   DELETE /api/climate/:id
// @access  Private (Farmer)
const deleteClimateProfile = async (req, res, next) => {
  try {
    const profile = await ClimateProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Climate profile not found'
      });
    }

    // Check ownership
    if (profile.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this climate profile'
      });
    }

    await profile.deleteOne();

    // Update credit profile
    await updateClimateScore(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Climate profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update climate score in credit profile
async function updateClimateScore(farmerId) {
  try {
    const profiles = await ClimateProfile.find({ farmer: farmerId });
    
    const creditProfile = await CreditProfile.findOne({ farmer: farmerId });
    if (!creditProfile) return;

    if (profiles.length > 0) {
      // Calculate average compliance score
      const avgScore = profiles.reduce((sum, p) => sum + p.climateComplianceScore, 0) / profiles.length;
      creditProfile.climateComplianceScore = Math.round(avgScore);
    } else {
      creditProfile.climateComplianceScore = 0;
    }

    // Recalculate trust score
    creditProfile.calculateTrustScore();
    creditProfile.updateCreditworthinessRating();
    creditProfile.lastUpdated = Date.now();
    
    await creditProfile.save();
  } catch (error) {
    console.error('Error updating climate score:', error);
  }
}

export {
    createClimateProfile,
    getMyClimateProfiles,
    getClimateProfile,
    updateClimateProfile,
    deleteClimateProfile
};
