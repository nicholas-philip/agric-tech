import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const produceBatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    default: () => uuidv4(),
    // unique: true,
    required: true
  },
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
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  crop: {
    type: String,
    required: [true, 'Crop type is required'],
    trim: true
  },
  quantity: {
    value: {
      type: Number,
      required: [true, 'Quantity value is required'],
      min: 0
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['kg', 'tons', 'bags', 'crates', 'pieces']
    }
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'premium', 'standard', 'substandard'],
    default: 'standard'
  },
  moistureLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['harvested', 'aggregated', 'in_transit', 'sold', 'processed'],
    default: 'harvested'
  },
  images: [{
    type: String
  }],
  certifications: [{
    type: String
  }],
  storageLocation: {
    type: String,
    trim: true
  },
  estimatedValue: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
produceBatchSchema.index({ farmer: 1 });
produceBatchSchema.index({ currentOwner: 1 });
produceBatchSchema.index({ status: 1 });
produceBatchSchema.index({ harvestDate: -1 });

const ProduceBatch = mongoose.model('ProduceBatch', produceBatchSchema);

export default ProduceBatch;