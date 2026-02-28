import Farm from '../model/Farm.js';
import CreditProfile from '../model/CreditProfile.js';

// @desc    Create new farm
// @route   POST /api/farms
// @access  Private (Farmer)
const createFarm = async (req, res, next) => {
  try {
    const { farmName, boundary, soilType, crops } = req.body;

    const farm = await Farm.create({
      farmer: req.user.id,
      farmName,
      boundary,
      soilType,
      crops
    });

    // Update credit profile with total land
    await updateFarmerCreditProfile(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: farm
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all farms for logged-in farmer
// @route   GET /api/farms/my
// @access  Private (Farmer)
const getMyFarms = async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id, isActive: true });

    res.status(200).json({
      success: true,
      count: farms.length,
      data: farms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single farm
// @route   GET /api/farms/:id
// @access  Private
const getFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findById(req.params.id).populate('farmer', 'name phone email');

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check permissions
    if (req.user.role === 'farmer' && farm.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this farm'
      });
    }

    res.status(200).json({
      success: true,
      data: farm
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update farm
// @route   PUT /api/farms/:id
// @access  Private (Farmer)
const updateFarm = async (req, res, next) => {
  try {
    let farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check ownership
    if (farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this farm'
      });
    }

    farm = await Farm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update credit profile
    await updateFarmerCreditProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Farm updated successfully',
      data: farm
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete farm
// @route   DELETE /api/farms/:id
// @access  Private (Farmer)
const deleteFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check ownership
    if (farm.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this farm'
      });
    }

    farm.isActive = false;
    await farm.save();

    // Update credit profile
    await updateFarmerCreditProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Farm deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farms by location (geospatial query)
// @route   GET /api/farms/nearby
// @access  Private (Agronomist, Agent)
const getNearbyFarms = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 50000 } = req.query; // maxDistance in meters

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    const farms = await Farm.find({
      boundary: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isActive: true
    }).populate('farmer', 'name phone');

    res.status(200).json({
      success: true,
      count: farms.length,
      data: farms
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update farmer credit profile
async function updateFarmerCreditProfile(farmerId) {
  try {
    const farms = await Farm.find({ farmer: farmerId, isActive: true });
    const totalLand = farms.reduce((sum, farm) => sum + farm.areaHectares, 0);

    await CreditProfile.findOneAndUpdate(
      { farmer: farmerId },
      { totalMappedLandHectares: totalLand },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating credit profile:', error);
  }
}

export {
  createFarm,
  getMyFarms,
  getFarm,
  updateFarm,
  deleteFarm,
  getNearbyFarms
};
