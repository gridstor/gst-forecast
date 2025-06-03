// Enhanced Schedule Form JavaScript

class EnhancedScheduleForm {
  constructor() {
    this.currentPreviewData = null;
    this.initializeElements();
    this.attachEventListeners();
    this.setDefaultDates();
  }

  initializeElements() {
    // Form elements
    this.form = document.getElementById('enhancedScheduleForm');
    this.previewModal = document.getElementById('previewModal');
    this.previewContent = document.getElementById('previewContent');
    
    // Buttons
    this.previewBtn = document.getElementById('previewBtn');
    this.createDirectBtn = document.getElementById('createDirectBtn');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.editPreviewBtn = document.getElementById('editPreviewBtn');
    this.confirmCreateBtn = document.getElementById('confirmCreateBtn');
    
    // Status elements
    this.loadingMessage = document.getElementById('loadingMessage');
    this.loadingText = document.getElementById('loadingText');
    this.successMessage = document.getElementById('successMessage');
    this.successText = document.getElementById('successText');
    this.errorMessage = document.getElementById('errorMessage');
    this.errorText = document.getElementById('errorText');
    
    // Custom input elements
    this.customDropdowns = [
      'market', 'curveType', 'batteryDuration', 'scenario', 'degradationType'
    ];
    
    // Frequency and date elements
    this.frequencySelect = document.getElementById('frequency');
    this.dayOfWeekContainer = document.getElementById('dayOfWeekContainer');
    this.dayOfMonthContainer = document.getElementById('dayOfMonthContainer');
    
    // Delivery period elements
    this.deliveryStart = document.getElementById('deliveryPeriodStart');
    this.deliveryEnd = document.getElementById('deliveryPeriodEnd');
    this.degradationDate = document.getElementById('degradationStartDate');
    this.deliveryPeriodSummary = document.getElementById('deliveryPeriodSummary');
  }

  attachEventListeners() {
    // Custom dropdown handlers
    this.customDropdowns.forEach(field => {
      const select = document.getElementById(field);
      const customInput = document.getElementById(field + 'Custom');
      
      select.addEventListener('change', () => this.handleCustomDropdown(field));
    });
    
    // Frequency change handler
    this.frequencySelect.addEventListener('change', () => this.handleFrequencyChange());
    
    // Date validation handlers
    this.deliveryStart.addEventListener('change', () => this.validateDeliveryPeriod());
    this.deliveryEnd.addEventListener('change', () => this.validateDeliveryPeriod());
    this.degradationDate.addEventListener('change', () => this.validateDegradationDate());
    
    // Button handlers
    this.previewBtn.addEventListener('click', () => this.handlePreview());
    this.createDirectBtn.addEventListener('click', () => this.handleDirectCreate());
    this.cancelBtn.addEventListener('click', () => this.handleCancel());
    this.editPreviewBtn.addEventListener('click', () => this.closePreview());
    this.confirmCreateBtn.addEventListener('click', () => this.handleConfirmCreate());
    
    // Modal close handler
    this.previewModal.addEventListener('click', (e) => {
      if (e.target === this.previewModal) {
        this.closePreview();
      }
    });
  }

  setDefaultDates() {
    // Set default delivery period to next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    this.deliveryStart.value = this.formatDateTimeLocal(nextMonth);
    this.deliveryEnd.value = this.formatDateTimeLocal(monthEnd);
    
    this.validateDeliveryPeriod();
  }

  formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  handleCustomDropdown(fieldName) {
    const select = document.getElementById(fieldName);
    const customInput = document.getElementById(fieldName + 'Custom');
    
    if (select.value === 'CUSTOM') {
      customInput.classList.remove('hidden');
      customInput.required = true;
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
      customInput.value = '';
    }
  }

  handleFrequencyChange() {
    const frequency = this.frequencySelect.value;
    
    // Hide all day selectors
    this.dayOfWeekContainer.classList.add('hidden');
    this.dayOfMonthContainer.classList.add('hidden');
    
    // Show relevant selector
    if (frequency === 'WEEKLY') {
      this.dayOfWeekContainer.classList.remove('hidden');
    } else if (frequency === 'MONTHLY') {
      this.dayOfMonthContainer.classList.remove('hidden');
    }
  }

  validateDeliveryPeriod() {
    const startDate = new Date(this.deliveryStart.value);
    const endDate = new Date(this.deliveryEnd.value);
    
    if (this.deliveryStart.value && this.deliveryEnd.value) {
      if (endDate <= startDate) {
        this.deliveryEnd.setCustomValidity('End date must be after start date');
        this.deliveryPeriodSummary.classList.add('hidden');
        return false;
      } else {
        this.deliveryEnd.setCustomValidity('');
        this.updateDeliveryPeriodSummary(startDate, endDate);
        return true;
      }
    }
    return false;
  }

  updateDeliveryPeriodSummary(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('deliveryDuration').textContent = diffDays;
    this.deliveryPeriodSummary.classList.remove('hidden');
    
    this.validateDegradationDate();
  }

  validateDegradationDate() {
    const startDate = new Date(this.deliveryStart.value);
    const endDate = new Date(this.deliveryEnd.value);
    const degradationDate = new Date(this.degradationDate.value);
    
    const degradationInfo = document.getElementById('degradationInfo');
    
    if (this.degradationDate.value) {
      if (degradationDate < startDate || degradationDate > endDate) {
        this.degradationDate.setCustomValidity('Degradation date must be within delivery period');
        degradationInfo.classList.add('hidden');
        return false;
      } else {
        this.degradationDate.setCustomValidity('');
        const diffTime = Math.abs(degradationDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('degradationDays').textContent = diffDays;
        degradationInfo.classList.remove('hidden');
        return true;
      }
    } else {
      degradationInfo.classList.add('hidden');
      return true;
    }
  }

  gatherFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    // Standard form fields
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('Custom')) continue; // Skip custom input fields
      
      if (key === 'notificationEmails' && value) {
        data[key] = value.split(',').map(email => email.trim()).filter(email => email);
      } else if (['dayOfWeek', 'dayOfMonth', 'freshnessDays', 'importance'].includes(key)) {
        data[key] = value ? parseInt(value) : null;
      } else {
        data[key] = value || null;
      }
    }
    
    // Handle custom dropdown values
    this.customDropdowns.forEach(field => {
      const select = document.getElementById(field);
      const customInput = document.getElementById(field + 'Custom');
      
      if (select.value === 'CUSTOM' && customInput.value) {
        data[field] = customInput.value;
      }
    });
    
    return data;
  }

  validateForm() {
    const data = this.gatherFormData();
    const errors = [];
    
    // Required fields
    if (!data.market) errors.push('Market is required');
    if (!data.location) errors.push('Location is required');
    if (!data.product) errors.push('Product is required');
    if (!data.curveType) errors.push('Curve Type is required');
    if (!data.deliveryPeriodStart) errors.push('Delivery Start is required');
    if (!data.deliveryPeriodEnd) errors.push('Delivery End is required');
    
    // Date validations
    if (data.deliveryPeriodStart && data.deliveryPeriodEnd) {
      const startDate = new Date(data.deliveryPeriodStart);
      const endDate = new Date(data.deliveryPeriodEnd);
      
      if (endDate <= startDate) {
        errors.push('Delivery end must be after start date');
      }
      
      if (data.degradationStartDate) {
        const degradationDate = new Date(data.degradationStartDate);
        if (degradationDate < startDate || degradationDate > endDate) {
          errors.push('Degradation start date must be within delivery period');
        }
      }
    }
    
    return errors;
  }

  async handlePreview() {
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.showError('Validation failed: ' + errors.join(', '));
      return;
    }
    
    const data = this.gatherFormData();
    
    try {
      this.showLoading('Generating preview...');
      
      const response = await fetch('/api/curve-schedule/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.currentPreviewData = result.preview;
        this.displayPreview(result.preview);
        this.hideLoading();
      } else {
        throw new Error(result.error || 'Failed to generate preview');
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Preview failed: ' + error.message);
    }
  }

  displayPreview(previewData) {
    const { curveDefinition, schedule, instanceTemplate, validation } = previewData;
    
    this.previewContent.innerHTML = `
      <!-- Validation Status -->
      <div class="mb-6 p-4 ${validation.deliveryPeriodValid && validation.degradationDateValid && validation.freshnessReasonable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-md">
        <h4 class="font-medium ${validation.deliveryPeriodValid && validation.degradationDateValid && validation.freshnessReasonable ? 'text-green-900' : 'text-red-900'} mb-2">Validation Status</h4>
        <div class="text-sm space-y-1">
          <div class="flex items-center">
            <span class="w-4 h-4 mr-2">${validation.deliveryPeriodValid ? '✅' : '❌'}</span>
            <span>Delivery period: ${validation.deliveryPeriodValid ? 'Valid' : 'Invalid'}</span>
          </div>
          <div class="flex items-center">
            <span class="w-4 h-4 mr-2">${validation.degradationDateValid ? '✅' : '❌'}</span>
            <span>Degradation date: ${validation.degradationDateValid ? 'Valid' : 'Invalid'}</span>
          </div>
          <div class="flex items-center">
            <span class="w-4 h-4 mr-2">${validation.freshnessReasonable ? '✅' : '❌'}</span>
            <span>Freshness period: ${validation.freshnessReasonable ? 'Reasonable' : 'Check value'}</span>
          </div>
        </div>
      </div>

      <!-- Curve Definition -->
      <div class="border border-gray-200 rounded-lg p-4 mb-4">
        <h4 class="font-medium text-gray-900 mb-3 flex items-center">
          Curve Definition
          ${curveDefinition.isExisting ? 
            '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Existing</span>' : 
            '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">New</span>'
          }
          ${curveDefinition.hasCustomValues ? 
            '<span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Custom Values</span>' : ''
          }
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Curve Name:</strong> ${curveDefinition.curveName}</div>
          <div><strong>Market:</strong> ${curveDefinition.market}</div>
          <div><strong>Location:</strong> ${curveDefinition.location}</div>
          <div><strong>Product:</strong> ${curveDefinition.product}</div>
          <div><strong>Type:</strong> ${curveDefinition.curveType} ${curveDefinition.customFields?.curveType ? '(Custom)' : ''}</div>
          <div><strong>Battery:</strong> ${curveDefinition.batteryDuration} ${curveDefinition.customFields?.batteryDuration ? '(Custom)' : ''}</div>
          <div><strong>Scenario:</strong> ${curveDefinition.scenario} ${curveDefinition.customFields?.scenario ? '(Custom)' : ''}</div>
          <div><strong>Degradation:</strong> ${curveDefinition.degradationType} ${curveDefinition.customFields?.degradationType ? '(Custom)' : ''}</div>
        </div>
      </div>

      <!-- Schedule Details -->
      <div class="border border-gray-200 rounded-lg p-4 mb-4">
        <h4 class="font-medium text-gray-900 mb-3">Schedule Configuration</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Frequency:</strong> ${schedule.frequency}</div>
          <div><strong>Responsible Team:</strong> ${schedule.responsibleTeam}</div>
          <div><strong>Time of Day:</strong> ${schedule.timeOfDay}</div>
          <div><strong>Freshness:</strong> ${schedule.freshnessDays} days</div>
          <div><strong>Importance:</strong> ${schedule.importance}/5</div>
          <div><strong>Next Due:</strong> ${new Date(schedule.nextDeliveryDue).toLocaleDateString()}</div>
          ${schedule.dayOfWeek !== null ? `<div><strong>Day of Week:</strong> ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][schedule.dayOfWeek]}</div>` : ''}
          ${schedule.dayOfMonth !== null ? `<div><strong>Day of Month:</strong> ${schedule.dayOfMonth}</div>` : ''}
        </div>
      </div>

      <!-- Instance Template -->
      <div class="border border-gray-200 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-3">Instance Template</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Delivery Start:</strong> ${new Date(instanceTemplate.deliveryPeriodStart).toLocaleString()}</div>
          <div><strong>Delivery End:</strong> ${new Date(instanceTemplate.deliveryPeriodEnd).toLocaleString()}</div>
          <div><strong>Duration:</strong> ${instanceTemplate.deliveryDuration} days</div>
          <div><strong>Granularity:</strong> ${instanceTemplate.granularity}</div>
          <div><strong>Version:</strong> ${instanceTemplate.instanceVersion}</div>
          ${instanceTemplate.degradationStartDate ? 
            `<div><strong>Degradation Start:</strong> ${new Date(instanceTemplate.degradationStartDate).toLocaleDateString()} (${instanceTemplate.degradationDaysFromStart} days from start)</div>` : 
            '<div><strong>Degradation:</strong> Not specified</div>'
          }
        </div>
      </div>
    `;
    
    this.previewModal.classList.remove('hidden');
  }

  async handleDirectCreate() {
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.showError('Validation failed: ' + errors.join(', '));
      return;
    }
    
    await this.createEnhancedSchedule();
  }

  async handleConfirmCreate() {
    await this.createEnhancedSchedule();
  }

  async createEnhancedSchedule() {
    const data = this.gatherFormData();
    
    try {
      this.showLoading('Creating enhanced schedule...');
      this.closePreview();
      
      const response = await fetch('/api/curve-schedule/create-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.hideLoading();
        this.showSuccess(`Enhanced schedule created successfully! Schedule ID: ${result.result.scheduleId}, Template ID: ${result.result.templateId}`);
        
        // Reset form after delay
        setTimeout(() => {
          this.form.reset();
          this.setDefaultDates();
          this.handleFrequencyChange();
          this.hideSuccess();
        }, 5000);
      } else {
        throw new Error(result.error || 'Failed to create enhanced schedule');
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Creation failed: ' + error.message);
    }
  }

  closePreview() {
    this.previewModal.classList.add('hidden');
  }

  handleCancel() {
    if (confirm('Are you sure you want to cancel? All form data will be lost.')) {
      window.location.href = '/curve-schedule/manage';
    }
  }

  showLoading(message) {
    this.loadingText.textContent = message;
    this.loadingMessage.classList.remove('hidden');
    this.hideError();
    this.hideSuccess();
  }

  hideLoading() {
    this.loadingMessage.classList.add('hidden');
  }

  showSuccess(message) {
    this.successText.textContent = message;
    this.successMessage.classList.remove('hidden');
    this.hideError();
    this.hideLoading();
  }

  hideSuccess() {
    this.successMessage.classList.add('hidden');
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorMessage.classList.remove('hidden');
    this.hideSuccess();
    this.hideLoading();
  }

  hideError() {
    this.errorMessage.classList.add('hidden');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedScheduleForm();
}); 