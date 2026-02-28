import mongoose from 'mongoose';

const cooperativeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cooperative name is required'],
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  members: [{
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'leader', 'treasurer', 'secretary'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalMappedLand: {
    type: Number,
    default: 0
  },
  totalYieldHistory: [{
    crop: String,
    quantity: Number,
    unit: String,
    season: String,
    year: Number
  }],
  cropsGrown: [{
    type: String
  }],
  groupTrustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index
cooperativeSchema.index({ location: '2dsphere' });

// Method to calculate total mapped land
cooperativeSchema.methods.calculateTotalLand = async function() {
  const Farm = mongoose.model('Farm');
  
  const memberIds = this.members.map(m => m.farmer);
  
  const farms = await Farm.find({ farmer: { $in: memberIds }, isActive: true });
  
  this.totalMappedLand = farms.reduce((total, farm) => total + farm.areaHectares, 0);
  
  return this.totalMappedLand;
};

// Method to calculate group trust score
cooperativeSchema.methods.calculateGroupTrustScore = async function() {
  const CreditProfile = mongoose.model('CreditProfile');
  
  const memberIds = this.members.filter(m => m.isActive).map(m => m.farmer);
  
  if (memberIds.length === 0) {
    this.groupTrustScore = 0;
    return 0;
  }
  
  const creditProfiles = await CreditProfile.find({ farmer: { $in: memberIds } });
  
  if (creditProfiles.length === 0) {
    this.groupTrustScore = 0;
    return 0;
  }
  
  const avgTrustScore = creditProfiles.reduce((sum, profile) => sum + profile.trustScore, 0) / creditProfiles.length;
  
  this.groupTrustScore = Math.round(avgTrustScore);
  
  return this.groupTrustScore;
};

const Cooperative = mongoose.model('Cooperative', cooperativeSchema);

export default Cooperative;