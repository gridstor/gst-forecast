/**
 * Bulk Upload Script for Channel View Curves
 * 
 * This script uploads Channel View revenue curves with p-value distributions
 * for Energy, AS (Ancillary Services), and Total revenue streams.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration - UPDATED FOR CHANNEL VIEW
const CONFIG = {
  market: 'ERCOT',              // ERCOT market
  location: 'Channel View',     // Project location
  batteryDuration: 'TWO_H',     // 2-hour battery duration
  scenario: 'P50',              // Forecast scenario
  units: '$/kW-month',          // Units for the revenue values
  instanceVersion: '2024-Q4',   // Version identifier for this forecast run
  createdBy: 'Bulk Upload System',
  
  // API base URL (use local dev server or deployed URL)
  baseUrl: 'http://localhost:4324', // Change to your deployed URL if needed
};

// Your Channel View data
const CHANNEL_VIEW_DATA = [
  { project: 'Channel View', year: 2028, p5_ea: 3.0333333, p5_as: 0.6066666, p5_total: 3.64, p25_ea: 4.62, p25_as: 0.9216666, p25_total: 5.5416666, p50_ea: 6.355102, p50_as: 1.2710204, p50_total: 7.6261224, p75_ea: 8.6566666, p75_as: 1.7266666, p75_total: 10.383333, p95_ea: 11.83, p95_as: 2.3666666, p95_total: 14.196667 },
  { project: 'Channel View', year: 2029, p5_ea: 3.3021557, p5_as: 0.6604311, p5_total: 3.775, p25_ea: 5.295488, p25_as: 1.0590977, p25_total: 6.0924305, p50_ea: 6.900904, p50_as: 1.3801808, p50_total: 8.2934585, p75_ea: 8.620505, p75_as: 1.724101, p75_total: 10.61041, p95_ea: 12.4805418, p95_as: 2.4961084, p95_total: 14.7249309 },
  { project: 'Channel View', year: 2030, p5_ea: 7.779130, p5_as: 4.416869, p5_total: 3.19, p25_ea: 4.1926762, p25_as: 0.6294648, p25_total: 7.8293411, p50_ea: 5.504204, p50_as: 0.8295975, p50_total: 6.38, p75_ea: 7.9696655, p75_as: 1.9491563, p75_total: 9.164582, p95_ea: 10.182607, p95_as: 1.6216720, p95_total: 12.4399931 },
  { project: 'Channel View', year: 2031, p5_ea: 2.9877363, p5_as: 0.4520916, p5_total: 3.43, p25_ea: 4.7961031, p25_as: 0.7174498, p25_total: 5.5135530, p50_ea: 5.9678034, p50_as: 0.8921965, p50_total: 6.86, p75_ea: 8.0491977, p75_as: 1.2088539, p75_total: 9.2580515, p95_ea: 11.636446, p95_as: 1.7395702, p95_total: 13.376017 },
  { project: 'Channel View', year: 2032, p5_ea: 3.4117866, p5_as: 0.5127776, p5_total: 5.9250642, p25_ea: 5.655118, p25_as: 0.8554272, p25_total: 6.5115809, p50_ea: 6.8056981, p50_as: 1.0243918, p50_total: 7.8400642, p75_ea: 8.876684, p75_as: 1.3386475, p75_total: 10.215231, p95_ea: 13.284832, p95_as: 2.0027892, p95_total: 15.287621 },
  { project: 'Channel View', year: 2033, p5_ea: 3.5462467, p5_as: 0.5340760, p5_total: 4.0803407, p25_ea: 6.0006535, p25_as: 0.9036555, p25_total: 6.7508917, p50_ea: 7.0843825, p50_as: 1.0656574, p50_total: 8.1500313, p75_ea: 8.6916136, p75_as: 1.3137356, p75_total: 10.00598, p95_ea: 13.8205662, p95_as: 2.0826566, p95_total: 16.1154532 },
  { project: 'Channel View', year: 2034, p5_ea: 5.6782608, p5_as: 0.5569937, p5_total: 4.2952546, p25_ea: 6.021839, p25_as: 0.9038012, p25_total: 6.9256397, p50_ea: 7.3551221, p50_as: 1.1004878, p50_total: 8.46, p75_ea: 9.006484, p75_as: 1.1856976, p75_total: 11.202931, p95_ea: 14.345217, p95_as: 2.1449069, p95_total: 16.499627 },
  { project: 'Channel View', year: 2035, p5_ea: 3.7891531, p5_as: 0.5658468, p5_total: 4.355, p25_ea: 6.254267, p25_as: 0.9387099, p25_total: 7.1842243, p50_ea: 7.5756265, p50_as: 1.1337146, p50_total: 8.6996555, p75_ea: 9.1748027, p75_as: 2.2296911, p75_total: 11.39772, p95_ea: 14.762540, p95_as: 2.2027610, p95_total: 16.965362 },
  { project: 'Channel View', year: 2036, p5_ea: 3.9522906, p5_as: 0.5791066, p5_total: 5.6800067, p25_ea: 6.100719, p25_as: 0.8912620, p25_total: 7.0022916, p50_ea: 7.8891187, p50_as: 1.1869137, p50_total: 8.78, p75_ea: 10.072879, p75_as: 2.4603, p75_total: 12.533208, p95_ea: 14.877758, p95_as: 2.2384175, p95_total: 17.125824 },
  { project: 'Channel View', year: 2037, p5_ea: 8.2074720, p5_as: 0.5789010, p5_total: 4.39, p25_ea: 5.8951426, p25_as: 0.8876483, p25_total: 6.7827912, p50_ea: 7.6330630, p50_as: 1.1463969, p50_total: 8.78, p75_ea: 10.072879, p75_as: 2.4603, p75_total: 12.533208, p95_ea: 14.877758, p95_as: 2.2384175, p95_total: 17.125824 },
  { project: 'Channel View', year: 2038, p5_ea: 4.0101875, p5_as: 0.604406, p5_total: 4.605, p25_ea: 6.2455312, p25_as: 0.9305937, p25_total: 7.1761250, p50_ea: 8.0074203, p50_as: 1.2025796, p50_total: 9.21, p75_ea: 10.47638, p75_as: 2.542344, p75_total: 13.018718, p95_ea: 15.618625, p95_as: 2.3408750, p95_total: 17.959500 },
  { project: 'Channel View', year: 2039, p5_ea: 4.089578, p5_as: 0.615422, p5_total: 4.705, p25_ea: 5.3130379, p25_as: 0.9252113, p25_total: 7.2669493, p50_ea: 8.181743, p50_as: 1.2181526, p50_total: 9.41, p75_ea: 10.879736, p75_as: 2.6304234, p75_total: 13.430054, p95_ea: 15.9913395, p95_as: 2.4213806, p95_total: 18.3554704 },
  { project: 'Channel View', year: 2040, p5_ea: 4.1048350, p5_as: 0.6184821, p5_total: 4.65, p25_ea: 6.3881517, p25_as: 0.9517631, p25_total: 7.5565788, p50_ea: 8.0824451, p50_as: 1.2117584, p50_total: 9.3, p75_ea: 10.860197, p75_as: 2.611814, p75_total: 13.6444667, p95_ea: 16.320416, p95_as: 2.4582834, p95_total: 18.782749 },
  { project: 'Channel View', year: 2041, p5_ea: 4.189661, p5_as: 0.6299108, p5_total: 4.8197720, p25_ea: 5.5050782, p25_as: 0.9830426, p25_total: 7.4921009, p50_ea: 8.373052, p50_as: 1.2569475, p50_total: 9.63, p75_ea: 10.966174, p75_as: 2.681851, p75_total: 13.648067, p95_ea: 16.320416, p95_as: 2.4582834, p95_total: 18.782749 },
  { project: 'Channel View', year: 2042, p5_ea: 4.2391224, p5_as: 0.6458775, p5_total: 4.945, p25_ea: 5.5589693, p25_as: 0.989, p25_total: 5.5789693, p50_ea: 8.6042999, p50_as: 1.2857, p50_total: 9.89, p75_ea: 11.434051, p75_as: 2.785347, p75_total: 14.219397, p95_ea: 16.762540, p95_as: 2.5222991, p95_total: 19.2855 },
  { project: 'Channel View', year: 2043, p5_ea: 4.3617857, p5_as: 0.6532142, p5_total: 5.015, p25_ea: 5.9484244, p25_as: 0.9036571, p25_total: 5.6464428, p50_ea: 8.7217991, p50_as: 1.3026209, p50_total: 10.03, p75_ea: 11.788928, p75_as: 2.856710, p75_total: 14.6464247, p95_ea: 17.015178, p95_as: 2.5954218, p95_total: 19.9542817 },
  { project: 'Channel View', year: 2044, p5_ea: 4.4715706, p5_as: 0.6781167, p5_total: 5.1053874, p25_ea: 6.7127344, p25_as: 1.0128376, p25_total: 5.7255611, p50_ea: 8.9904146, p50_as: 1.3395853, p50_total: 10.29, p75_ea: 12.132502, p75_as: 2.9636090, p75_total: 15.095591, p95_ea: 17.444513, p95_as: 2.6290680, p95_total: 20.062806 },
  { project: 'Channel View', year: 2045, p5_ea: 4.4926331, p5_as: 0.6723668, p5_total: 5.165, p25_ea: 6.8357297, p25_as: 1.0187376, p25_total: 5.8544674, p50_ea: 8.9791536, p50_as: 1.3503461, p50_total: 10.33, p75_ea: 12.041479, p75_as: 2.9237774, p75_total: 14.965256, p95_ea: 17.522287, p95_as: 2.6181558, p95_total: 20.140443 },
  { project: 'Channel View', year: 2046, p5_ea: 4.584354, p5_as: 0.6906558, p5_total: 5.265, p25_ea: 5.9966444, p25_as: 1.0599980, p25_total: 8.0474743, p50_ea: 9.3956043, p50_as: 1.3750643, p50_total: 10.53, p75_ea: 12.211596, p75_as: 2.9826136, p75_total: 15.184120, p95_ea: 17.856998, p95_as: 2.6732580, p95_total: 20.5294956 },
  { project: 'Channel View', year: 2047, p5_ea: 4.7048559, p5_as: 0.7045663, p5_total: 5.4003326, p25_ea: 7.1051444, p25_as: 1.1069948, p25_total: 8.2539486, p50_ea: 9.3956043, p50_as: 1.4043956, p50_total: 10.8, p75_ea: 12.671730, p75_as: 3.0674207, p75_total: 15.709922, p95_ea: 18.464357, p95_as: 2.7696536, p95_total: 21.234010 },
  { project: 'Channel View', year: 2048, p5_ea: 4.735214, p5_as: 0.717493, p5_total: 5.449964, p25_ea: 7.2467639, p25_as: 1.0820510, p25_total: 8.3281149, p50_ea: 9.4721336, p50_as: 1.4178661, p50_total: 10.89, p75_ea: 12.617310, p75_as: 3.0674356, p75_total: 15.694703, p95_ea: 18.464357, p95_as: 2.7696536, p95_total: 21.234010 },
  { project: 'Channel View', year: 2049, p5_ea: 4.7900649, p5_as: 0.725148, p5_total: 5.505, p25_ea: 7.231051, p25_as: 1.0928293, p25_total: 8.3238666, p50_ea: 9.5773262, p50_as: 1.4326737, p50_total: 11.01, p75_ea: 12.699471, p75_as: 3.1475472, p75_total: 16.045158, p95_ea: 18.689896, p95_as: 2.8089763, p95_total: 21.4680786 },
  { project: 'Channel View', year: 2050, p5_ea: 4.9334565, p5_as: 0.7465777, p5_total: 5.6800044, p25_ea: 7.5162222, p25_as: 1.1299555, p25_total: 8.6461777, p50_ea: 9.8699913, p50_as: 1.4800086, p50_total: 11.35, p75_ea: 13.206355, p75_as: 3.2183555, p75_total: 16.424711, p95_ea: 19.239511, p95_as: 2.8955112, p95_total: 22.135022 }
];

class CurveBulkUploader {
  constructor(config) {
    this.config = config;
    this.curves = [];
  }

  async uploadAll() {
    console.log('🚀 Starting bulk upload for Channel View curves...');
    
    try {
      // Step 1: Create curve definitions
      await this.createCurveDefinitions();
      
      // Step 2: Create curve instances
      await this.createCurveInstances();
      
      // Step 3: Upload price data
      await this.uploadPriceData();
      
      console.log('✅ Bulk upload completed successfully!');
      console.log(`📊 Uploaded ${this.curves.length} curves with ${CHANNEL_VIEW_DATA.length} years each`);
      
    } catch (error) {
      console.error('❌ Bulk upload failed:', error);
      throw error;
    }
  }

  async createCurveDefinitions() {
    console.log('📋 Creating curve definitions...');
    
    const curveTypes = [
      { 
        name: 'Channel View Energy Revenue',
        curveType: 'ENERGY',
        product: 'Energy Storage Revenue',
        description: 'Annual energy revenue projections for Channel View project'
      },
      { 
        name: 'Channel View AS Revenue',
        curveType: 'AS',
        product: 'Ancillary Services Revenue',
        description: 'Annual ancillary services revenue projections for Channel View project'
      },
      { 
        name: 'Channel View Total Revenue',
        curveType: 'REVENUE',
        product: 'Total Revenue',
        description: 'Annual total revenue projections (Energy + AS) for Channel View project'
      }
    ];

    for (const curveSpec of curveTypes) {
      const response = await fetch(`${this.config.baseUrl}/api/curve-upload/create-definition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curveName: curveSpec.name,
          market: this.config.market,
          location: this.config.location,
          product: curveSpec.product,
          curveType: curveSpec.curveType,
          batteryDuration: this.config.batteryDuration,
          scenario: this.config.scenario,
          commodity: 'Energy',
          units: this.config.units,
          description: curveSpec.description,
          createdBy: this.config.createdBy
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create curve definition for ${curveSpec.name}: ${error}`);
      }

      const result = await response.json();
      this.curves.push({
        ...curveSpec,
        definition: result.curveDefinition
      });
      
      console.log(`  ✅ Created: ${curveSpec.name} (ID: ${result.curveDefinition.id})`);
    }
  }

  async createCurveInstances() {
    console.log('📅 Creating curve instances...');
    
    const deliveryStart = new Date(Math.min(...CHANNEL_VIEW_DATA.map(d => d.year)), 0, 1);
    const deliveryEnd = new Date(Math.max(...CHANNEL_VIEW_DATA.map(d => d.year)) + 1, 0, 1);

    for (const curve of this.curves) {
      const response = await fetch(`${this.config.baseUrl}/api/curve-upload/create-instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curveDefinitionId: curve.definition.id,
          instanceVersion: this.config.instanceVersion,
          granularity: 'ANNUALLY',
          deliveryPeriodStart: deliveryStart.toISOString().split('T')[0],
          deliveryPeriodEnd: deliveryEnd.toISOString().split('T')[0],
          forecastRunDate: new Date().toISOString().split('T')[0],
          createdBy: this.config.createdBy,
          notes: `Bulk uploaded Channel View ${curve.curveType} revenue projections`,
          modelType: 'Revenue Forecast Model'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create instance for ${curve.name}: ${error}`);
      }

      const result = await response.json();
      curve.instance = result.curveInstance;
      
      console.log(`  ✅ Created instance: ${curve.name} v${this.config.instanceVersion}`);
    }
  }

  async uploadPriceData() {
    console.log('💰 Uploading price data...');
    
    for (const curve of this.curves) {
      const priceData = this.transformDataForCurve(curve);
      
      const response = await fetch(`${this.config.baseUrl}/api/curve-upload/upload-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curveInstanceId: curve.instance.id,
          priceData: priceData
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload price data for ${curve.name}: ${error}`);
      }

      const result = await response.json();
      console.log(`  ✅ Uploaded ${result.recordsCreated} price points for ${curve.name}`);
    }
  }

  transformDataForCurve(curve) {
    const priceData = [];
    const pValues = [5, 25, 50, 75, 95];
    
    for (const yearData of CHANNEL_VIEW_DATA) {
      for (const pValue of pValues) {
        const timestamp = new Date(yearData.year, 0, 1).toISOString();
        let value;
        
        // Get the correct value based on curve type and p-value
        if (curve.curveType === 'ENERGY') {
          value = yearData[`p${pValue}_ea`];
        } else if (curve.curveType === 'AS') {
          value = yearData[`p${pValue}_as`];
        } else if (curve.curveType === 'REVENUE') {
          value = yearData[`p${pValue}_total`];
        }
        
        if (value !== undefined && value !== null) {
          priceData.push({
            timestamp: timestamp,
            value: parseFloat(value),
            pvalue: parseInt(pValue),
            units: this.config.units,
            granularity: 'ANNUALLY'
          });
        }
      }
    }
    
    return priceData;
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Channel View Bulk Upload Starting...');
    console.log(`📍 Market: ${CONFIG.market}`);
    console.log(`🏭 Location: ${CONFIG.location}`);
    console.log(`⚡ Battery Duration: ${CONFIG.batteryDuration}`);
    console.log(`📊 Scenario: ${CONFIG.scenario}`);
    console.log(`💵 Units: ${CONFIG.units}`);
    console.log(`📈 Data Points: ${CHANNEL_VIEW_DATA.length} years`);
    console.log('');
    
    const uploader = new CurveBulkUploader(CONFIG);
    await uploader.uploadAll();
    
    console.log('');
    console.log('🎉 SUCCESS! All curves uploaded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Visit /curve-viewer/ to see your curves');
    console.log('2. Check /admin/curve-inventory to manage them');
    console.log('3. Use /curve-tracker/ to track updates');
    
  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (typeof module !== 'undefined' && require.main === module) {
  main();
}

// Export for use as module
if (typeof module !== 'undefined') {
  module.exports = { CurveBulkUploader, CONFIG, main };
}
