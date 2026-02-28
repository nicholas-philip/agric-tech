import mongoose from 'mongoose';

const climateProfileSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  season: {
    type: String,
    required: [true, 'Season is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  practicesUsed: [{
    type: String,
    enum: [
      'crop_rotation',
      'cover_cropping',
      'minimum_tillage',
      'no_tillage',
      'composting',
      'organic_fertilizer',
      'water_conservation',
      'drip_irrigation',
      'rainwater_harvesting',
      'agroforestry',
      'integrated_pest_management',
      'mulching',
      'terracing',
      'contour_farming'
    ]
  }],
  fertilizerUsage: {
    type: {
      type: String,
      enum: ['organic', 'synthetic', 'mixed', 'none'],
      default: 'none'
    },
    quantity: Number,
    unit: String
  },
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'rainfed', 'none'],
    default: 'rainfed'
  },
  soilManagementPractice: {
    type: String,
    enum: ['conventional_tillage', 'minimum_tillage', 'no_tillage', 'conservation_agriculture'],
    default: 'conventional_tillage'
  },
  treesPlanted: {
    type: Number,
    default: 0,
    min: 0
  },
  carbonSequestrationEstimate: {
    type: Number,
    default: 0,
    min: 0
  },
  waterUsageEfficiency: {
    type: Number,
    min: 0,
    max: 100
  },
  climateComplianceScore: {
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
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Method to calculate climate compliance score
climateProfileSchema.methods.calculateComplianceScore = function() {
  let score = 0;
  
  // Climate-smart practices (40 points)
  const practicesScore = Math.min(40, this.practicesUsed.length * 5);
  score += practicesScore;
  
  // Organic fertilizer usage (15 points)
  if (this.fertilizerUsage.type === 'organic') {
    score += 15;
  } else if (this.fertilizerUsage.type === 'mixed') {
    score += 7;
  }
  
  // Water-efficient irrigation (15 points)
  if (this.irrigationType === 'drip') {
    score += 15;
  } else if (this.irrigationType === 'sprinkler') {
    score += 10;
  }
  
  // Soil conservation (15 points)
  if (this.soilManagementPractice === 'no_tillage') {
    score += 15;
  } else if (this.soilManagementPractice === 'minimum_tillage') {
    score += 10;
  } else if (this.soilManagementPractice === 'conservation_agriculture') {
    score += 12;
  }
  
  // Tree planting (15 points)
  const treeScore = Math.min(15, this.treesPlanted * 0.5);
  score += treeScore;
  
  this.climateComplianceScore = Math.min(100, Math.round(score));
  return this.climateComplianceScore;
};

// Indexes
climateProfileSchema.index({ farmer: 1, year: -1 });
climateProfileSchema.index({ climateComplianceScore: -1 });

const ClimateProfile = mongoose.model('ClimateProfile', climateProfileSchema);

export default ClimateProfile;