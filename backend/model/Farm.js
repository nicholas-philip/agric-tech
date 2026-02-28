import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  farmName: {
    type: String,
    required: [true, 'Farm name is required'],
    trim: true
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays (Polygon format)
      required: true
    }
  },
  areaHectares: {
    type: Number
  },
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'other'],
    default: 'other',
    lowercase: true
  },
  crops: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
farmSchema.index({ boundary: '2dsphere' });
farmSchema.index({ farmer: 1 });

// Method to calculate area using Turf.js formula (simplified Haversine)
farmSchema.statics.calculateArea = function(coordinates) {
  // This is a simplified calculation
  // For production, consider using turf.js
  
  // Convert coordinates to radians and calculate using shoelace formula
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const coords = coordinates[0]; // First ring of polygon
  const earthRadius = 6371000; // meters
  
  let area = 0;
  
  if (coords.length > 2) {
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      
      area += toRadians(p2[0] - p1[0]) * 
              (2 + Math.sin(toRadians(p1[1])) + 
              Math.sin(toRadians(p2[1])));
    }
    
    area = Math.abs(area * earthRadius * earthRadius / 2);
  }
  
  // Convert square meters to hectares
  return area / 10000;
};

// Pre-validate hook to calculate area
farmSchema.pre('validate', async function() {
  console.log('DEBUG: Farm validation hook running (async version)');
  if (this.isModified('boundary') && this.boundary && this.boundary.coordinates) {
    this.areaHectares = this.constructor.calculateArea(this.boundary.coordinates);
  }
});

const Farm = mongoose.model('Farm', farmSchema);

export default Farm;