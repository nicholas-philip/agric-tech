import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['farmer', 'investor', 'agent', 'agronomist', 'agrodealer'],
      required: [true, 'Role is required'],
    },
    nationalId: {
      type: String,
      sparse: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Farmer-specific fields
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    cropsGrown: [
      {
        type: String,
      },
    ],

    // AgroDealer-specific fields
    businessName: String,
    licenseNumber: String,
    isVerifiedDealer: {
      type: Boolean,
      default: false,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    productsSold: [
      {
        type: String,
      },
    ],

    // Agronomist-specific fields
    certifications: [
      {
        type: String,
      },
    ],
    specialization: String,
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
