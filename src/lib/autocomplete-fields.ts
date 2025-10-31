/**
 * Autocomplete Field Manager
 * Fetches and caches unique field values from database
 * Populates datalists for autocomplete functionality
 */

interface FieldValues {
  markets: string[];
  locations: string[];
  products: string[];
  commodities: string[];
  curveTypes: string[];
  batteryDurations: string[];
  scenarios: string[];
  degradationTypes: string[];
  units: string[];
  granularities: string[];
  timezones: string[];
}

interface FieldValuesResponse {
  values: FieldValues;
  stats: {
    totalDefinitions: number;
    uniqueMarkets: number;
    uniqueLocations: number;
    uniqueProducts: number;
  };
}

let cachedValues: FieldValues | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch unique field values from the API
 */
export async function fetchFieldValues(force: boolean = false): Promise<FieldValues> {
  const now = Date.now();
  
  // Return cached values if fresh
  if (!force && cachedValues && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedValues;
  }

  try {
    const response = await fetch('/api/admin/curve-field-values');
    if (!response.ok) {
      throw new Error(`Failed to fetch field values: ${response.statusText}`);
    }
    
    const data: FieldValuesResponse = await response.json();
    cachedValues = data.values;
    cacheTimestamp = now;
    
    console.log('✓ Loaded field values from database:', data.stats);
    return cachedValues;
  } catch (error) {
    console.error('Error fetching field values:', error);
    // Return sensible defaults on error
    return getDefaultValues();
  }
}

/**
 * Get default values if API fails
 */
function getDefaultValues(): FieldValues {
  return {
    markets: ['CAISO', 'ERCOT', 'PJM', 'MISO', 'NYISO', 'SPP'],
    locations: [],
    products: [],
    commodities: ['Energy', 'Capacity', 'Ancillary Services'],
    curveTypes: ['REVENUE', 'ENERGY', 'AS', 'RA'],
    batteryDurations: ['TWO_H', 'FOUR_H', 'EIGHT_H', 'UNKNOWN'],
    scenarios: ['BASE', 'HIGH', 'LOW', 'P50', 'P90', 'P10'],
    degradationTypes: ['NONE', 'YEAR_1', 'YEAR_5', 'YEAR_10', 'YEAR_20'],
    units: ['$/MWh', '$/kW-month', 'MWh', 'MW'],
    granularities: ['HOURLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'],
    timezones: ['UTC', 'America/Los_Angeles', 'America/Chicago', 'America/New_York']
  };
}

/**
 * Setup autocomplete for a specific input field
 * Creates a datalist and associates it with the input
 */
export function setupAutocomplete(
  inputElement: HTMLInputElement | HTMLSelectElement,
  fieldType: keyof FieldValues,
  values: FieldValues
): void {
  const fieldValues = values[fieldType] || [];
  
  if (inputElement.tagName === 'SELECT') {
    // For select elements, populate options
    const selectEl = inputElement as HTMLSelectElement;
    const currentValue = selectEl.value;
    
    // Clear existing options except the first placeholder
    while (selectEl.options.length > 1) {
      selectEl.remove(1);
    }
    
    // Add options from database
    fieldValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
    
    // Add "Other..." option
    const otherOption = document.createElement('option');
    otherOption.value = '__OTHER__';
    otherOption.textContent = '+ Add New Value...';
    otherOption.style.fontStyle = 'italic';
    otherOption.style.color = '#6B7280';
    selectEl.appendChild(otherOption);
    
    // Restore previous value if it exists
    if (currentValue && fieldValues.includes(currentValue)) {
      selectEl.value = currentValue;
    }
  } else {
    // For text inputs, use datalist
    const inputEl = inputElement as HTMLInputElement;
    const datalistId = `${inputEl.id}-datalist`;
    
    // Remove existing datalist if present
    const existingDatalist = document.getElementById(datalistId);
    if (existingDatalist) {
      existingDatalist.remove();
    }
    
    // Create new datalist
    const datalist = document.createElement('datalist');
    datalist.id = datalistId;
    
    fieldValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      datalist.appendChild(option);
    });
    
    inputEl.setAttribute('list', datalistId);
    inputEl.after(datalist);
    
    // Add helper text if not present
    if (!inputEl.nextElementSibling || !inputEl.nextElementSibling.classList.contains('autocomplete-hint')) {
      const hint = document.createElement('p');
      hint.className = 'autocomplete-hint text-xs text-gray-500 mt-1';
      hint.textContent = `${fieldValues.length} existing value${fieldValues.length !== 1 ? 's' : ''} available • Type to search or enter new`;
      datalist.after(hint);
    }
  }
}

/**
 * Handle "Add New" selection in select elements
 */
export function handleOtherSelection(selectElement: HTMLSelectElement, fieldLabel: string): void {
  selectElement.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    if (target.value === '__OTHER__') {
      const newValue = prompt(`Enter new ${fieldLabel}:`);
      if (newValue && newValue.trim()) {
        // Add the new value to the select
        const newOption = document.createElement('option');
        newOption.value = newValue.trim();
        newOption.textContent = newValue.trim();
        // Insert before the "Other" option
        const otherOption = Array.from(target.options).find(opt => opt.value === '__OTHER__');
        if (otherOption) {
          target.insertBefore(newOption, otherOption);
        }
        target.value = newValue.trim();
        
        // Clear cache to refresh on next load
        cachedValues = null;
      } else {
        target.value = ''; // Reset to placeholder
      }
    }
  });
}

/**
 * Initialize all autocomplete fields on a form
 */
export async function initializeAutocompleteFields(formContainer: HTMLElement): Promise<void> {
  const values = await fetchFieldValues();
  
  // Map of field IDs to field types
  const fieldMappings: Record<string, keyof FieldValues> = {
    'defMarket': 'markets',
    'editDefMarket': 'markets',
    'defLocation': 'locations',
    'editDefLocation': 'locations',
    'defProduct': 'products',
    'editDefProduct': 'products',
    'defCommodity': 'commodities',
    'editDefCommodity': 'commodities',
    'defCurveType': 'curveTypes',
    'editDefCurveType': 'curveTypes',
    'defBatteryDuration': 'batteryDurations',
    'editDefBatteryDuration': 'batteryDurations',
    'defScenario': 'scenarios',
    'editDefScenario': 'scenarios',
    'defDegradationType': 'degradationTypes',
    'editDefDegradationType': 'degradationTypes',
    'defUnits': 'units',
    'editDefUnits': 'units',
    'defGranularity': 'granularities',
    'editDefGranularity': 'granularities',
    'defTimezone': 'timezones',
    'editDefTimezone': 'timezones',
  };
  
  // Setup each field
  Object.entries(fieldMappings).forEach(([fieldId, fieldType]) => {
    const element = formContainer.querySelector(`#${fieldId}`) as HTMLInputElement | HTMLSelectElement;
    if (element) {
      setupAutocomplete(element, fieldType, values);
      
      // Setup "Other" handler for select elements
      if (element.tagName === 'SELECT') {
        const label = element.previousElementSibling?.textContent?.replace('*', '').trim() || fieldType;
        handleOtherSelection(element as HTMLSelectElement, label);
      }
    }
  });
  
  console.log(`✓ Initialized autocomplete for ${Object.keys(fieldMappings).length} fields`);
}

/**
 * Refresh autocomplete values (e.g., after creating a new definition)
 */
export async function refreshAutocompleteValues(): Promise<void> {
  await fetchFieldValues(true);
}

