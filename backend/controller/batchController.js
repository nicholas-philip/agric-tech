import ProduceBatch from '../model/ProduceBatch.js';
import BatchTransaction from '../model/BatchTransaction.js';
import Farm from '../model/Farm.js';

// @desc    Create produce batch
// @route   POST /api/batches
// @access  Private (Farmer)
const createBatch = async (req, res, next) => {
  try {
    const {
      farm,
      harvestDate,
      crop,
      quantity,
      qualityGrade,
      moistureLevel,
      images,
      storageLocation,
      estimatedValue,
      currency,
      notes
    } = req.body;

    // Verify farm belongs to farmer
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
        message: 'Not authorized to create batch for this farm'
      });
    }

    const batch = await ProduceBatch.create({
      farmer: req.user.id,
      farm,
      currentOwner: req.user.id,
      harvestDate,
      crop,
      quantity,
      qualityGrade,
      moistureLevel,
      images,
      storageLocation,
      estimatedValue,
      currency,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch by ID
// @route   GET /api/batches/:batchId
// @access  Public (for traceability)
const getBatch = async (req, res, next) => {
  try {
    const batch = await ProduceBatch.findOne({ batchId: req.params.batchId })
      .populate('farmer', 'name phone location')
      .populate('farm', 'farmName areaHectares')
      .populate('currentOwner', 'name phone role');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all batches for logged-in user
// @route   GET /api/batches/my
// @access  Private
const getMyBatches = async (req, res, next) => {
  try {
    const { status, crop, startDate, endDate } = req.query;

    let query = {};

    // Farmers see batches they created
    // Others see batches they currently own
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    } else {
      query.currentOwner = req.user.id;
    }

    if (status) query.status = status;
    if (crop) query.crop = crop;
    if (startDate || endDate) {
      query.harvestDate = {};
      if (startDate) query.harvestDate.$gte = new Date(startDate);
      if (endDate) query.harvestDate.$lte = new Date(endDate);
    }

    const batches = await ProduceBatch.find(query)
      .populate('farm', 'farmName')
      .populate('currentOwner', 'name role')
      .sort('-harvestDate');

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:batchId
// @access  Private (Current Owner)
const updateBatch = async (req, res, next) => {
  try {
    let batch = await ProduceBatch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Only current owner can update
    if (batch.currentOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this batch'
      });
    }

    const allowedUpdates = ['status', 'qualityGrade', 'moistureLevel', 'storageLocation', 'estimatedValue', 'notes', 'images'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    batch = await ProduceBatch.findOneAndUpdate(
      { batchId: req.params.batchId },
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer batch ownership
// @route   POST /api/batches/transfer
// @access  Private (Current Owner)
const transferBatch = async (req, res, next) => {
  try {
    const { batchId, toUser, transactionType, quantity, price, currency, location, notes } = req.body;

    const batch = await ProduceBatch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Only current owner can transfer
    if (batch.currentOwner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to transfer this batch'
      });
    }

    // Create transaction record
    const transaction = await BatchTransaction.create({
      batch: batch._id,
      fromUser: req.user.id,
      toUser,
      transactionType,
      quantity,
      price,
      currency,
      location,
      notes
    });

    // Update batch ownership
    batch.currentOwner = toUser;
    batch.status = 'sold';
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch transferred successfully',
      data: {
        batch,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch transaction history
// @route   GET /api/batches/:batchId/history
// @access  Public (for traceability)
const getBatchHistory = async (req, res, next) => {
  try {
    const batch = await ProduceBatch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const transactions = await BatchTransaction.find({ batch: batch._id })
      .populate('fromUser', 'name role phone')
      .populate('toUser', 'name role phone')
      .sort('date');

    res.status(200).json({
      success: true,
      data: {
        batch,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

export { createBatch, getBatch, getMyBatches, updateBatch, transferBatch, getBatchHistory };
