import User from '../model/User.js';
import InputTransaction from '../model/InputTransaction.js';
import CreditProfile from '../model/CreditProfile.js';

// @desc    Register/Create agro-dealer profile
// @route   POST /api/agrodealers
// @access  Private (AgroDealer role)
const createProfile = async (req, res, next) => {
  try {
    const { businessName, licenseNumber, location, productsSold } = req.body;

    if (req.user.role !== 'agrodealer') {
      return res.status(403).json({
        success: false,
        message: 'Only agro-dealers can create dealer profiles'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        businessName,
        licenseNumber,
        location,
        productsSold
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Agro-dealer profile updated successfully',
      data: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all agro-dealers
// @route   GET /api/agrodealers
// @access  Public
const getAgrodealers = async (req, res, next) => {
  try {
    const { verified, minTrustScore, location } = req.query;

    let query = { role: 'agrodealer', isActive: true };

    if (verified === 'true') {
      query.isVerifiedDealer = true;
    }

    if (minTrustScore) {
      query.trustScore = { $gte: parseInt(minTrustScore) };
    }

    const agrodealers = await User.find(query)
      .select('-password')
      .sort('-trustScore');

    res.status(200).json({
      success: true,
      count: agrodealers.length,
      data: agrodealers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single agro-dealer
// @route   GET /api/agrodealers/:id
// @access  Public
const getAgrodealer = async (req, res, next) => {
  try {
    const agrodealer = await User.findOne({
      _id: req.params.id,
      role: 'agrodealer'
    }).select('-password');

    if (!agrodealer) {
      return res.status(404).json({
        success: false,
        message: 'Agro-dealer not found'
      });
    }

    // Get transaction statistics
    const transactions = await InputTransaction.find({ agroDealer: req.params.id });
    const ratings = transactions.filter(t => t.farmerRating).map(t => t.farmerRating);
    
    const stats = {
      totalTransactions: transactions.length,
      averageRating: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0,
      totalRatings: ratings.length
    };

    res.status(200).json({
      success: true,
      data: {
        agrodealer: agrodealer.toPublicJSON(),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record input transaction
// @route   POST /api/agrodealers/transactions
// @access  Private (Farmer, AgroDealer)
const recordTransaction = async (req, res, next) => {
  try {
    const {
      farmer,
      agroDealer,
      productName,
      productCategory,
      quantity,
      price,
      currency,
      batchNumber,
      expiryDate,
      notes
    } = req.body;

    // Verify agro-dealer exists
    const dealer = await User.findOne({ _id: agroDealer, role: 'agrodealer' });
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Agro-dealer not found'
      });
    }

    // If user is farmer, they must be the farmer in transaction
    if (req.user.role === 'farmer' && farmer !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to record transaction for another farmer'
      });
    }

    const transaction = await InputTransaction.create({
      farmer,
      agroDealer,
      productName,
      productCategory,
      quantity,
      price,
      currency,
      batchNumber,
      expiryDate,
      notes
    });

    // Update farmer's credit profile
    await updateInputPurchaseFrequency(farmer);

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions for logged-in user
// @route   GET /api/agrodealers/transactions/my
// @access  Private
const getMyTransactions = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    } else if (req.user.role === 'agrodealer') {
      query.agroDealer = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view transactions'
      });
    }

    const transactions = await InputTransaction.find(query)
      .populate('farmer', 'name phone')
      .populate('agroDealer', 'businessName location')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate agro-dealer
// @route   POST /api/agrodealers/:id/rate
// @access  Private (Farmer)
const rateAgrodealer = async (req, res, next) => {
  try {
    const { transactionId, rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find transaction
    const transaction = await InputTransaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify farmer owns this transaction
    if (transaction.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this transaction'
      });
    }

    // Verify transaction is for this agro-dealer
    if (transaction.agroDealer.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction does not belong to this agro-dealer'
      });
    }

    // Update transaction with rating
    transaction.farmerRating = rating;
    transaction.farmerReview = review;
    await transaction.save();

    // Recalculate agro-dealer trust score
    await calculateDealerTrustScore(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Update farmer's input purchase frequency
async function updateInputPurchaseFrequency(farmerId) {
  try {
    const transactions = await InputTransaction.find({ farmer: farmerId });
    
    const creditProfile = await CreditProfile.findOne({ farmer: farmerId });
    if (!creditProfile) return;

    creditProfile.inputPurchaseFrequency = transactions.length;
    
    // Recalculate trust score
    creditProfile.calculateTrustScore();
    creditProfile.updateCreditworthinessRating();
    creditProfile.lastUpdated = Date.now();
    
    await creditProfile.save();
  } catch (error) {
    console.error('Error updating input purchase frequency:', error);
  }
}

// Helper: Calculate agro-dealer trust score
async function calculateDealerTrustScore(dealerId) {
  try {
    const transactions = await InputTransaction.find({ agroDealer: dealerId });
    const ratings = transactions.filter(t => t.farmerRating).map(t => t.farmerRating);
    
    let trustScore = 0;

    if (ratings.length > 0) {
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      trustScore = (avgRating / 5) * 100;
    }

    // Bonus for verified dealers
    const dealer = await User.findById(dealerId);
    if (dealer && dealer.isVerifiedDealer) {
      trustScore = Math.min(100, trustScore + 10);
    }

    // Bonus for transaction volume
    const volumeBonus = Math.min(20, transactions.length * 0.5);
    trustScore = Math.min(100, trustScore + volumeBonus);

    await User.findByIdAndUpdate(dealerId, { trustScore: Math.round(trustScore) });
  } catch (error) {
    console.error('Error calculating dealer trust score:', error);
  }
}

export {
  createProfile,
  getAgrodealers,
  getAgrodealer,
  recordTransaction,
  getMyTransactions,
  rateAgrodealer
};
