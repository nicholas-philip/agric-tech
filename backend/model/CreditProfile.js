import mongoose from 'mongoose';

const creditProfileSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalMappedLandHectares: {
    type: Number,
    default: 0
  },
  totalHarvestVolume: {
    type: Number,
    default: 0
  },
  harvestHistory: [{
    crop: String,
    quantity: Number,
    unit: String,
    season: String,
    year: Number,
    date: Date
  }],
  activityConsistencyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  inputPurchaseFrequency: {
    type: Number,
    default: 0
  },
  climateComplianceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  totalActivitiesLogged: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date
  },
  creditworthinessRating: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'unrated'],
    default: 'unrated'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'unassessed'],
    default: 'unassessed'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate trust score
creditProfileSchema.methods.calculateTrustScore = function() {
  let score = 0;
  
  // Land ownership verification (20 points)
  if (this.totalMappedLandHectares > 0) {
    score += Math.min(20, this.totalMappedLandHectares * 2);
  }
  
  // Activity consistency (30 points)
  score += this.activityConsistencyScore * 0.3;
  
  // Harvest history (25 points)
  if (this.harvestHistory.length > 0) {
    score += Math.min(25, this.harvestHistory.length * 5);
  }
  
  // Input purchase frequency (15 points)
  score += Math.min(15, this.inputPurchaseFrequency * 3);
  
  // Climate compliance (10 points)
  score += this.climateComplianceScore * 0.1;
  
  this.trustScore = Math.min(100, Math.round(score));
  return this.trustScore;
};

// Method to calculate activity consistency
creditProfileSchema.methods.calculateActivityConsistency = function(activitiesCount, daysActive) {
  if (daysActive === 0) return 0;
  
  const avgActivitiesPerMonth = (activitiesCount / daysActive) * 30;
  const consistencyScore = Math.min(100, avgActivitiesPerMonth * 20);
  
  this.activityConsistencyScore = Math.round(consistencyScore);
  return this.activityConsistencyScore;
};

// Method to determine creditworthiness rating
creditProfileSchema.methods.updateCreditworthinessRating = function() {
  if (this.trustScore >= 80) {
    this.creditworthinessRating = 'excellent';
    this.riskLevel = 'low';
  } else if (this.trustScore >= 60) {
    this.creditworthinessRating = 'good';
    this.riskLevel = 'low';
  } else if (this.trustScore >= 40) {
    this.creditworthinessRating = 'fair';
    this.riskLevel = 'medium';
  } else if (this.trustScore >= 20) {
    this.creditworthinessRating = 'poor';
    this.riskLevel = 'high';
  } else {
    this.creditworthinessRating = 'unrated';
    this.riskLevel = 'unassessed';
  }
};

// Index
creditProfileSchema.index({ trustScore: -1 });

const CreditProfile = mongoose.model('CreditProfile', creditProfileSchema);

export default CreditProfile;