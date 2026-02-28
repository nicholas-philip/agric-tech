import CreditProfile from '../model/CreditProfile.js';
import Farm from '../model/Farm.js';
import Activity from '../model/Activity.js';
import InputTransaction from '../model/InputTransaction.js';

// @desc    Get my credit passport
// @route   GET /api/farmers/credit-passport
// @access  Private (Farmer)
const getMyCreditPassport = async (req, res, next) => {
  try {
    let creditProfile = await CreditProfile.findOne({ farmer: req.user.id });

    if (!creditProfile) {
      // Create one if doesn't exist
      creditProfile = await CreditProfile.create({ farmer: req.user.id });
    }

    // Get additional context data
    const farms = await Farm.find({ farmer: req.user.id, isActive: true });
    const recentActivities = await Activity.find({ farmer: req.user.id })
      .sort('-date')
      .limit(10);
    const inputTransactions = await InputTransaction.find({ farmer: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        creditProfile,
        context: {
          totalFarms: farms.length,
          recentActivitiesCount: recentActivities.length,
          totalInputPurchases: inputTransactions.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh/recalculate credit score
// @route   POST /api/farmers/credit-passport/refresh
// @access  Private (Farmer)
const refreshCreditScore = async (req, res, next) => {
  try {
    let creditProfile = await CreditProfile.findOne({ farmer: req.user.id });

    if (!creditProfile) {
      creditProfile = await CreditProfile.create({ farmer: req.user.id });
    }

    // Recalculate all metrics
    // 1. Total mapped land
    const farms = await Farm.find({ farmer: req.user.id, isActive: true });
    creditProfile.totalMappedLandHectares = farms.reduce((sum, f) => sum + f.areaHectares, 0);

    // 2. Activity metrics
    const activities = await Activity.find({ farmer: req.user.id });
    creditProfile.totalActivitiesLogged = activities.length;
    
    if (activities.length > 0) {
      creditProfile.lastActivityDate = activities.sort((a, b) => b.date - a.date)[0].date;
      const firstActivity = activities.sort((a, b) => a.date - b.date)[0];
      const daysActive = Math.ceil((Date.now() - firstActivity.date) / (1000 * 60 * 60 * 24));
      creditProfile.calculateActivityConsistency(activities.length, daysActive);
    }

    // 3. Harvest history
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

    // 4. Input purchase frequency
    const inputTransactions = await InputTransaction.find({ farmer: req.user.id });
    creditProfile.inputPurchaseFrequency = inputTransactions.length;

    // 5. Climate compliance (use existing value)
    // Already calculated from ClimateProfile

    // 6. Calculate final trust score
    creditProfile.calculateTrustScore();
    creditProfile.updateCreditworthinessRating();
    creditProfile.lastUpdated = Date.now();

    await creditProfile.save();

    res.status(200).json({
      success: true,
      message: 'Credit profile refreshed successfully',
      data: creditProfile
    });
  } catch (error) {
    next(error);
  }
};

export {
    getMyCreditPassport,
    refreshCreditScore
};