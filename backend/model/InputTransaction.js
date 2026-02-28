import mongoose from 'mongoose';

const inputTransactionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  agroDealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agro-dealer reference is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  productCategory: {
    type: String,
    enum: ['fertilizer', 'pesticide', 'herbicide', 'seeds', 'equipment', 'other'],
    default: 'other'
  },
  quantity: {
    value: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0
    },
    unit: {
      type: String,
      required: true
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  farmerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  farmerReview: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
inputTransactionSchema.index({ farmer: 1, date: -1 });
inputTransactionSchema.index({ agroDealer: 1, date: -1 });
inputTransactionSchema.index({ date: -1 });

const InputTransaction = mongoose.model('InputTransaction', inputTransactionSchema);

export default InputTransaction;