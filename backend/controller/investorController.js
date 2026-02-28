import mongoose from 'mongoose';
import User from '../model/User.js';
import Farm from '../model/Farm.js';
import CreditProfile from '../model/CreditProfile.js';
import ClimateProfile from '../model/ClimateProfile.js';
import Activity from '../model/Activity.js';

// @desc    Get all farmers (anonymized overview)
// @route   GET /api/investors/farmers
// @access  Private (Investor)
const getFarmers = async (req, res, next) => {
  try {
    const { minTrustScore, minLandSize, crop, location } = req.query;

    let query = { role: 'farmer', isActive: true };

    const farmers = await User.find(query).select('name location yearsOfExperience cropsGrown createdAt');

    // Get credit profiles for filtering
    let creditQuery = {};
    if (minTrustScore) {
      creditQuery.trustScore = { $gte: parseInt(minTrustScore) };
    }

    const creditProfiles = await CreditProfile.find(creditQuery).populate('farmer');

    // Filter by land size if specified
    let filteredFarmers = farmers;
    if (minLandSize || crop) {
      const farmerIds = creditProfiles.map(cp => cp.farmer._id);
      filteredFarmers = farmers.filter(f => farmerIds.includes(f._id));

      if (minLandSize) {
        const validFarmerIds = creditProfiles
          .filter(cp => cp.totalMappedLandHectares >= parseFloat(minLandSize))
          .map(cp => cp.farmer._id.toString());
        
        filteredFarmers = filteredFarmers.filter(f => validFarmerIds.includes(f._id.toString()));
      }
    }

    // Get basic stats for each farmer
    const farmersWithStats = await Promise.all(
      filteredFarmers.map(async (farmer) => {
        const creditProfile = await CreditProfile.findOne({ farmer: farmer._id });
        const farms = await Farm.find({ farmer: farmer._id, isActive: true });

        return {
          id: farmer._id,
          name: farmer.name,
          location: farmer.location,
          yearsOfExperience: farmer.yearsOfExperience,
          cropsGrown: farmer.cropsGrown,
          totalFarms: farms.length,
          totalLandHectares: creditProfile?.totalMappedLandHectares || 0,
          trustScore: creditProfile?.trustScore || 0,
          creditworthinessRating: creditProfile?.creditworthinessRating || 'unrated',
          memberSince: farmer.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: farmersWithStats.length,
      data: farmersWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single farmer details
// @route   GET /api/investors/farmers/:id
// @access  Private (Investor)
const getFarmer = async (req, res, next) => {
  try {
    const farmer = await User.findOne({
      _id: req.params.id,
      role: 'farmer'
    }).select('name location yearsOfExperience cropsGrown createdAt');

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    const farms = await Farm.find({ farmer: req.params.id, isActive: true });
    const creditProfile = await CreditProfile.findOne({ farmer: req.params.id });
    const activityCount = await Activity.countDocuments({ farmer: req.params.id });
    const recentActivities = await Activity.find({ farmer: req.params.id })
      .sort('-date')
      .limit(5)
      .select('activityType crop date season');

    res.status(200).json({
      success: true,
      data: {
        farmer: {
          id: farmer._id,
          name: farmer.name,
          location: farmer.location,
          yearsOfExperience: farmer.yearsOfExperience,
          cropsGrown: farmer.cropsGrown,
          memberSince: farmer.createdAt
        },
        farms: farms.map(f => ({
          id: f._id,
          farmName: f.farmName,
          areaHectares: f.areaHectares,
          soilType: f.soilType,
          crops: f.crops
        })),
        totalActivitiesLogged: activityCount,
        recentActivities,
        stats: {
          totalFarms: farms.length,
          totalLandHectares: farms.reduce((sum, f) => sum + f.areaHectares, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer credit passport
// @route   GET /api/investors/farmers/:id/credit
// @access  Private (Investor)
const getFarmerCredit = async (req, res, next) => {
  try {
    const creditProfile = await CreditProfile.findOne({ farmer: req.params.id });

    if (!creditProfile) {
      return res.status(404).json({
        success: false,
        message: 'Credit profile not found for this farmer'
      });
    }

    res.status(200).json({
      success: true,
      data: creditProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer climate profile
// @route   GET /api/investors/farmers/:id/climate
// @access  Private (Investor)
const getFarmerClimate = async (req, res, next) => {
  try {
    const climateProfiles = await ClimateProfile.find({ farmer: req.params.id })
      .sort('-year')
      .limit(3);

    if (climateProfiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No climate profiles found for this farmer'
      });
    }

    // Calculate overall climate stats
    const avgComplianceScore = climateProfiles.reduce((sum, p) => sum + p.climateComplianceScore, 0) / climateProfiles.length;
    const totalTreesPlanted = climateProfiles.reduce((sum, p) => sum + p.treesPlanted, 0);
    const allPractices = [...new Set(climateProfiles.flatMap(p => p.practicesUsed))];

    res.status(200).json({
      success: true,
      data: {
        profiles: climateProfiles,
        summary: {
          averageComplianceScore: Math.round(avgComplianceScore),
          totalTreesPlanted,
          uniquePracticesUsed: allPractices
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer activity history
// @route   GET /api/investors/farmers/:id/activities
// @access  Private (Investor)
const getFarmerActivities = async (req, res, next) => {
  try {
    const { year, activityType, limit = 20 } = req.query;

    let query = { farmer: req.params.id };
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (activityType) {
      query.activityType = activityType;
    }

    const activities = await Activity.find(query)
      .populate('farm', 'farmName')
      .sort('-date')
      .limit(parseInt(limit));

    // Activity statistics
    const stats = {
      totalActivities: await Activity.countDocuments({ farmer: req.params.id }),
      byType: await Activity.aggregate([
        { $match: { farmer: new mongoose.Types.ObjectId(req.params.id) } },
        { $group: { _id: '$activityType', count: { $sum: 1 } } }
      ])
    };

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
      stats
    });
  } catch (error) {
    next(error);
  }
};

export {getFarmers, getFarmer, getFarmerCredit, getFarmerClimate, getFarmerActivities};