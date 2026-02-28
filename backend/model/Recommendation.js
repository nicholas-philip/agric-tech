import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  agronomist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agronomist reference is required']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  category: {
    type: String,
    enum: ['soil_management', 'pest_control', 'irrigation', 'fertilization', 'crop_selection', 'harvesting', 'climate_adaptation', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  recommendationText: {
    type: String,
    required: [true, 'Recommendation text is required'],
    trim: true
  },
  implementationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'not_applicable'],
    default: 'pending'
  },
  expectedOutcome: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  followUpDate: {
    type: Date
  },
  farmerFeedback: {
    type: String,
    trim: true
  },
  isImplemented: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
recommendationSchema.index({ farmer: 1, createdAt: -1 });
recommendationSchema.index({ agronomist: 1 });
recommendationSchema.index({ implementationStatus: 1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;