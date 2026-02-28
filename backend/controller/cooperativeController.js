import Cooperative from '../model/Cooperative.js';
import User from '../model/User.js';

// @desc    Create cooperative
// @route   POST /api/cooperatives
// @access  Private (Farmer)
const createCooperative = async (req, res, next) => {
  try {
    const { name, registrationNumber, location, description } = req.body;

    const cooperative = await Cooperative.create({
      name,
      registrationNumber,
      location,
      description,
      members: [{
        farmer: req.user.id,
        role: 'leader',
        joinedDate: Date.now()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Cooperative created successfully',
      data: cooperative
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all cooperatives
// @route   GET /api/cooperatives
// @access  Public
const getCooperatives = async (req, res, next) => {
  try {
    const cooperatives = await Cooperative.find({ isActive: true })
      .populate('members.farmer', 'name phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: cooperatives.length,
      data: cooperatives
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single cooperative
// @route   GET /api/cooperatives/:id
// @access  Public
const getCooperative = async (req, res, next) => {
  try {
    const cooperative = await Cooperative.findById(req.params.id)
      .populate('members.farmer', 'name phone location yearsOfExperience');

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found'
      });
    }

    // Calculate current stats
    await cooperative.calculateTotalLand();
    await cooperative.calculateGroupTrustScore();
    await cooperative.save();

    res.status(200).json({
      success: true,
      data: cooperative
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to cooperative
// @route   POST /api/cooperatives/:id/members
// @access  Private (Cooperative leader)
const addMember = async (req, res, next) => {
  try {
    const { farmerId, role = 'member' } = req.body;

    const cooperative = await Cooperative.findById(req.params.id);

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found'
      });
    }

    // Check if user is a leader
    const isLeader = cooperative.members.some(
      m => m.farmer.toString() === req.user.id && (m.role === 'leader' || m.role === 'secretary')
    );

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Only cooperative leaders can add members'
      });
    }

    // Check if farmer exists and has farmer role
    const farmer = await User.findOne({ _id: farmerId, role: 'farmer' });
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Check if farmer is already a member
    const existingMember = cooperative.members.find(m => m.farmer.toString() === farmerId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Farmer is already a member of this cooperative'
      });
    }

    // Add member
    cooperative.members.push({
      farmer: farmerId,
      role,
      joinedDate: Date.now()
    });

    await cooperative.save();

    // Recalculate stats
    await cooperative.calculateTotalLand();
    await cooperative.calculateGroupTrustScore();
    await cooperative.save();

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: cooperative
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from cooperative
// @route   DELETE /api/cooperatives/:id/members/:farmerId
// @access  Private (Cooperative leader)
const removeMember = async (req, res, next) => {
  try {
    const cooperative = await Cooperative.findById(req.params.id);

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found'
      });
    }

    // Check if user is a leader
    const isLeader = cooperative.members.some(
      m => m.farmer.toString() === req.user.id && m.role === 'leader'
    );

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Only cooperative leaders can remove members'
      });
    }

    // Remove member
    cooperative.members = cooperative.members.filter(
      m => m.farmer.toString() !== req.params.farmerId
    );

    await cooperative.save();

    // Recalculate stats
    await cooperative.calculateTotalLand();
    await cooperative.calculateGroupTrustScore();
    await cooperative.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: cooperative
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cooperative
// @route   PUT /api/cooperatives/:id
// @access  Private (Cooperative leader)
const updateCooperative = async (req, res, next) => {
  try {
    let cooperative = await Cooperative.findById(req.params.id);

    if (!cooperative) {
      return res.status(404).json({
        success: false,
        message: 'Cooperative not found'
      });
    }

    // Check if user is a leader
    const isLeader = cooperative.members.some(
      m => m.farmer.toString() === req.user.id && m.role === 'leader'
    );

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Only cooperative leaders can update cooperative details'
      });
    }

    const allowedUpdates = ['name', 'location', 'description', 'cropsGrown', 'bankAccount', 'certifications'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    cooperative = await Cooperative.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Cooperative updated successfully',
      data: cooperative
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my cooperatives
// @route   GET /api/cooperatives/my
// @access  Private (Farmer)
const getMyCooperatives = async (req, res, next) => {
  try {
    const cooperatives = await Cooperative.find({
      'members.farmer': req.user.id,
      'members.isActive': true,
      isActive: true
    }).populate('members.farmer', 'name phone');

    res.status(200).json({
      success: true,
      count: cooperatives.length,
      data: cooperatives
    });
  } catch (error) {
    next(error);
  }
};

export {
    createCooperative,
    getCooperatives,
    getCooperative,
    addMember,
    removeMember,
    updateCooperative,
    getMyCooperatives
};
