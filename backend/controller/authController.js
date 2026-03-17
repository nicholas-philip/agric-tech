import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import CreditProfile from '../model/CreditProfile.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });

    // Create credit profile for farmers
    if (user.role === 'farmer') {
      await CreditProfile.create({ farmer: user._id });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toPublicJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is approved (for investors)
    if (user.role === 'investor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPublicJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login with Firebase
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res, next) => {
  try {
    const { idToken, name: nameFromClient, phone: phoneFromClient, role: roleFromClient } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID Token is required'
      });
    }

    // Verify Firebase token
    // We import admin inside to avoid circular dependencies if any
    const admin = (await import('../config/firebase-admin.js')).default;
    
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin SDK not initialized'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name: nameFromFirebase, picture } = decodedToken;

    // Find or create user in MongoDB
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email }]
    });

    if (!user) {
      // Create new user if not exists
      user = await User.create({
        firebaseUid: uid,
        email,
        name: nameFromClient || nameFromFirebase || email.split('@')[0],
        phone: phoneFromClient,
        role: roleFromClient,
        isActive: true,
      });

      // Create credit profile for farmers
      if (user.role === 'farmer') {
        await CreditProfile.create({ farmer: user._id });
      }
    } else {
      // User exists, check if we need to link UID
      let updated = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        updated = true;
      }
      
      // Optional: If you want to allow role updates via social login synchronization, 
      // you could add logic here, but usually roles are sticky.
      
      if (updated) await user.save();
    }

    // Generate backend token (optional, or just use Firebase)
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: user.toPublicJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Firebase Login Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid Firebase Token',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
    const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
    const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      location: req.body.location,
      role: req.body.role // Permit updating role after registration
    };

    // Role-specific fields
    if (req.user.role === 'farmer') {
      if (req.body.yearsOfExperience) fieldsToUpdate.yearsOfExperience = req.body.yearsOfExperience;
      if (req.body.cropsGrown) fieldsToUpdate.cropsGrown = req.body.cropsGrown;
      if (req.body.nationalId) fieldsToUpdate.nationalId = req.body.nationalId;
    }

    if (req.user.role === 'agrodealer') {
      if (req.body.businessName) fieldsToUpdate.businessName = req.body.businessName;
      if (req.body.licenseNumber) fieldsToUpdate.licenseNumber = req.body.licenseNumber;
      if (req.body.productsSold) fieldsToUpdate.productsSold = req.body.productsSold;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    // Create credit profile for farmers if role is set to farmer
    if (user.role === 'farmer') {
      const existingProfile = await CreditProfile.findOne({ farmer: user._id });
      if (!existingProfile) {
        await CreditProfile.create({ farmer: user._id });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
    const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  firebaseLogin,
  getMe,
  updateDetails,
  updatePassword
};
