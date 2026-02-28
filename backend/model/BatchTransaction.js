import mongoose from 'mongoose';

const batchTransactionSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProduceBatch',
    required: [true, 'Batch reference is required']
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From user is required']
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'To user is required']
  },
  transactionType: {
    type: String,
    enum: ['sale', 'transfer', 'aggregation', 'processing'],
    default: 'transfer'
  },
  quantity: {
    value: Number,
    unit: String
  },
  price: {
    type: Number,
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
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'disputed'],
    default: 'verified'
  }
}, {
  timestamps: true
});

// Indexes
batchTransactionSchema.index({ batch: 1, date: -1 });
batchTransactionSchema.index({ fromUser: 1 });
batchTransactionSchema.index({ toUser: 1 });

const BatchTransaction = mongoose.model('BatchTransaction', batchTransactionSchema);

export default BatchTransaction;    