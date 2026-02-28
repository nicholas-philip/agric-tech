import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required']
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Logger reference is required']
  },
  crop: {
    type: String,
    required: [true, 'Crop is required'],
    trim: true
  },
  activityType: {
    type: String,
    enum: ['planting', 'fertilizing', 'irrigation', 'harvesting', 'pest_control', 'weeding', 'pruning', 'other'],
    required: [true, 'Activity type is required']
  },
  season: {
    type: String,
    required: [true, 'Season is required']
  },
  inputUsed: {
    type: String,
    trim: true
  },
  quantity: {
    value: Number,
    unit: String
  },
  date: {
    type: Date,
    required: [true, 'Activity date is required'],
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ farmer: 1, date: -1 });
activitySchema.index({ farm: 1, date: -1 });
activitySchema.index({ activityType: 1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;