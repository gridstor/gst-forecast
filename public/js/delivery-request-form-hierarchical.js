// =====================================================
// HIERARCHICAL DELIVERY REQUEST FORM CONTROLLER
// Powers the multi-step curve delivery request workflow
// =====================================================

class DeliveryRequestForm {
    constructor() {
        this.currentStep = 1;
        this.formData = {};
        this.existingDefinitions = [];
        
        this.init();
    }

    init() {
        this.loadExistingDefinitions();
        this.bindEventListeners();
        this.updateStepIndicators();
    }

    // ========== EXISTING DEFINITIONS LOADING ==========
    async loadExistingDefinitions() {
        try {
            const response = await fetch('/api/curves/definitions');
            if (response.ok) {
                this.existingDefinitions = await response.json();
                this.populateExistingDefinitionsDropdown();
            } else {
                console.warn('Could not load existing definitions');
                this.populateExistingDefinitionsDropdown();
            }
        } catch (error) {
            console.error('Error loading existing definitions:', error);
            this.populateExistingDefinitionsDropdown();
        }
    }

    populateExistingDefinitionsDropdown() {
        const dropdown = document.getElementById('existingDefinition');
        dropdown.innerHTML = '<option value="">Select an existing definition</option>';
        
        if (this.existingDefinitions.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No existing definitions found';
            option.disabled = true;
            dropdown.appendChild(option);
            return;
        }

        this.existingDefinitions.forEach(def => {
            const option = document.createElement('option');
            option.value = def.id;
            option.textContent = `${def.market} ${def.location} ${def.product} ${def.curveType} (${def.batteryDuration}, ${def.scenario})`;
            dropdown.appendChild(option);
        });
    }

    // ========== EVENT LISTENERS ==========
    bindEventListeners() {
        // Definition option toggles
        document.querySelectorAll('input[name="definitionOption"]').forEach(radio => {
            radio.addEventListener('change', this.handleDefinitionOptionChange.bind(this));
        });

        // Step navigation
        document.getElementById('step1Next').addEventListener('click', this.goToStep2.bind(this));
        document.getElementById('step2Back').addEventListener('click', this.goToStep1.bind(this));
        document.getElementById('step2Next').addEventListener('click', this.goToStep3.bind(this));
        document.getElementById('step3Back').addEventListener('click', this.goToStep2.bind(this));
        
        // Preview and submit
        document.getElementById('previewRequest').addEventListener('click', this.showPreview.bind(this));
        document.getElementById('cancelPreview').addEventListener('click', this.hidePreview.bind(this));

        // Form validation triggers
        this.bindValidationListeners();

        // Degradation option handling
        document.querySelectorAll('input[name="degradationOption"]').forEach(radio => {
            radio.addEventListener('change', this.handleDegradationOptionChange.bind(this));
        });

        // Data point estimation
        document.getElementById('deliveryPeriodStart').addEventListener('change', this.updateDataPointEstimate.bind(this));
        document.getElementById('deliveryPeriodEnd').addEventListener('change', this.updateDataPointEstimate.bind(this));
        document.getElementById('granularity').addEventListener('change', this.updateDataPointEstimate.bind(this));

        // Form submission
        document.getElementById('deliveryRequestForm').addEventListener('submit', this.handleSubmit.bind(this));
    }

    bindValidationListeners() {
        // Step 1 validation
        const step1Fields = ['market', 'location', 'product', 'curveType', 'granularity'];
        step1Fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', this.validateStep1.bind(this));
                field.addEventListener('input', this.validateStep1.bind(this));
            }
        });

        document.getElementById('existingDefinition').addEventListener('change', this.validateStep1.bind(this));

        // Step 2 validation
        const step2Fields = ['curveCreator', 'instanceVersion', 'deliveryPeriodStart', 'deliveryPeriodEnd'];
        step2Fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', this.validateStep2.bind(this));
                field.addEventListener('input', this.validateStep2.bind(this));
            }
        });

        // Step 3 validation
        const step3Fields = ['dueDate', 'requestedBy'];
        step3Fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', this.validateStep3.bind(this));
                field.addEventListener('input', this.validateStep3.bind(this));
            }
        });
    }

    // ========== DEFINITION OPTION HANDLING ==========
    handleDefinitionOptionChange(event) {
        const option = event.target.value;
        const existingSection = document.getElementById('existingDefinitionSection');
        const newSection = document.getElementById('newDefinitionSection');

        if (option === 'existing') {
            existingSection.classList.remove('hidden');
            newSection.classList.add('hidden');
        } else if (option === 'new') {
            existingSection.classList.add('hidden');
            newSection.classList.remove('hidden');
        }

        this.validateStep1();
    }

    // ========== STEP NAVIGATION ==========
    goToStep1() {
        this.currentStep = 1;
        this.updateStepVisibility();
        this.updateStepIndicators();
    }

    goToStep2() {
        if (!this.validateStep1()) {
            this.showValidationError('Please complete Step 1 before continuing.');
            return;
        }

        this.currentStep = 2;
        this.updateStepVisibility();
        this.updateStepIndicators();
        this.populateStep2Defaults();
    }

    goToStep3() {
        if (!this.validateStep2()) {
            this.showValidationError('Please complete Step 2 before continuing.');
            return;
        }

        this.currentStep = 3;
        this.updateStepVisibility();
        this.updateStepIndicators();
        this.populateStep3Defaults();
    }

    updateStepVisibility() {
        // Reset all steps
        document.getElementById('step1').classList.remove('opacity-50', 'pointer-events-none');
        document.getElementById('step2').classList.remove('opacity-50', 'pointer-events-none');
        document.getElementById('step3').classList.remove('opacity-50', 'pointer-events-none');

        // Disable non-current steps
        if (this.currentStep < 2) {
            document.getElementById('step2').classList.add('opacity-50', 'pointer-events-none');
        }
        if (this.currentStep < 3) {
            document.getElementById('step3').classList.add('opacity-50', 'pointer-events-none');
        }
    }

    updateStepIndicators() {
        // Update progress indicators
        const indicators = ['step1-indicator', 'step2-indicator', 'step3-indicator'];
        const progresses = ['progress1', 'progress2'];
        const statuses = ['step1-status', 'step2-status', 'step3-status'];

        // Reset all
        indicators.forEach((id, index) => {
            const indicator = document.getElementById(id);
            const circle = indicator.querySelector('div');
            const text = indicator.querySelector('span');
            
            if (index + 1 === this.currentStep) {
                circle.className = 'flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold';
                text.className = 'ml-2 font-medium text-blue-600';
            } else if (index + 1 < this.currentStep) {
                circle.className = 'flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold';
                text.className = 'ml-2 font-medium text-green-600';
            } else {
                circle.className = 'flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-500 rounded-full font-bold';
                text.className = 'ml-2 text-gray-500';
            }
        });

        // Update progress bars
        progresses.forEach((id, index) => {
            const progress = document.getElementById(id);
            if (index + 1 < this.currentStep) {
                progress.className = 'w-16 h-1 bg-green-600 rounded';
            } else {
                progress.className = 'w-16 h-1 bg-gray-300 rounded';
            }
        });

        // Update status text
        document.getElementById('step1-status').textContent = 
            this.currentStep === 1 ? 'Active' : this.currentStep > 1 ? 'Complete' : 'Required';
        document.getElementById('step2-status').textContent = 
            this.currentStep === 2 ? 'Active' : this.currentStep > 2 ? 'Complete' : 'Locked';
        document.getElementById('step3-status').textContent = 
            this.currentStep === 3 ? 'Active' : 'Locked';
    }

    // ========== SMART DEFAULTS ==========
    populateStep2Defaults() {
        // Set default instance version
        if (!document.getElementById('instanceVersion').value) {
            document.getElementById('instanceVersion').value = 'v1.0';
        }

        // Set default delivery period (next month)
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

        if (!document.getElementById('deliveryPeriodStart').value) {
            document.getElementById('deliveryPeriodStart').value = 
                nextMonth.toISOString().slice(0, 16);
        }
        if (!document.getElementById('deliveryPeriodEnd').value) {
            document.getElementById('deliveryPeriodEnd').value = 
                endOfNextMonth.toISOString().slice(0, 16);
        }

        this.updateDataPointEstimate();
    }

    populateStep3Defaults() {
        // Set default due date (2 weeks from now)
        if (!document.getElementById('dueDate').value) {
            const twoWeeksFromNow = new Date();
            twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
            document.getElementById('dueDate').value = 
                twoWeeksFromNow.toISOString().slice(0, 10);
        }
    }

    // ========== VALIDATION ==========
    validateStep1() {
        const definitionOption = document.querySelector('input[name="definitionOption"]:checked');
        
        if (!definitionOption) {
            this.setStepValid(1, false);
            return false;
        }

        if (definitionOption.value === 'existing') {
            const existingDefinition = document.getElementById('existingDefinition').value;
            const isValid = !!existingDefinition;
            this.setStepValid(1, isValid);
            return isValid;
        } else if (definitionOption.value === 'new') {
            const requiredFields = ['market', 'location', 'product', 'curveType', 'granularity'];
            const isValid = requiredFields.every(fieldId => {
                const field = document.getElementById(fieldId);
                return field && field.value.trim() !== '';
            });
            this.setStepValid(1, isValid);
            return isValid;
        }

        return false;
    }

    validateStep2() {
        const requiredFields = ['curveCreator', 'instanceVersion', 'deliveryPeriodStart', 'deliveryPeriodEnd'];
        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        // Additional validation: end date must be after start date
        if (isValid) {
            const startDate = new Date(document.getElementById('deliveryPeriodStart').value);
            const endDate = new Date(document.getElementById('deliveryPeriodEnd').value);
            if (endDate <= startDate) {
                this.setStepValid(2, false);
                return false;
            }
        }

        this.setStepValid(2, isValid);
        return isValid;
    }

    validateStep3() {
        const requiredFields = ['dueDate', 'requestedBy'];
        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        this.setStepValid(3, isValid);
        return isValid;
    }

    setStepValid(step, isValid) {
        const nextButton = document.getElementById(`step${step}Next`) || 
                          document.getElementById('previewRequest');
        
        if (nextButton) {
            nextButton.disabled = !isValid;
        }
    }

    // ========== DEGRADATION HANDLING ==========
    handleDegradationOptionChange(event) {
        const degradationDate = document.getElementById('degradationStartDate');
        const isDegradationEnabled = event.target.value === 'date';
        
        degradationDate.disabled = !isDegradationEnabled;
        if (!isDegradationEnabled) {
            degradationDate.value = '';
        }
    }

    // ========== DATA POINT ESTIMATION ==========
    updateDataPointEstimate() {
        const startDate = document.getElementById('deliveryPeriodStart').value;
        const endDate = document.getElementById('deliveryPeriodEnd').value;
        const granularity = document.getElementById('granularity').value;
        const estimateElement = document.getElementById('dataPointEstimate');

        if (!startDate || !endDate) {
            estimateElement.textContent = 'Select delivery period and granularity to see estimate';
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dataPoints = 0;
        let description = '';

        switch (granularity) {
            case 'HOURLY':
                dataPoints = diffDays * 24;
                description = `~${dataPoints.toLocaleString()} hourly data points (${diffDays} days × 24 hours)`;
                break;
            case 'DAILY':
                dataPoints = diffDays;
                description = `~${dataPoints.toLocaleString()} daily data points`;
                break;
            case 'MONTHLY':
                dataPoints = Math.ceil(diffDays / 30);
                description = `~${dataPoints} monthly data points`;
                break;
            case 'QUARTERLY':
                dataPoints = Math.ceil(diffDays / 90);
                description = `~${dataPoints} quarterly data points`;
                break;
        }

        estimateElement.textContent = description;
    }

    // ========== PREVIEW ==========
    showPreview() {
        if (!this.validateStep3()) {
            this.showValidationError('Please complete all required fields before previewing.');
            return;
        }

        this.collectFormData();
        this.generatePreviewContent();
        document.getElementById('previewModal').classList.remove('hidden');
    }

    hidePreview() {
        document.getElementById('previewModal').classList.add('hidden');
    }

    collectFormData() {
        this.formData = {};

        // Curve Definition
        const definitionOption = document.querySelector('input[name="definitionOption"]:checked').value;
        this.formData.definitionOption = definitionOption;

        if (definitionOption === 'existing') {
            this.formData.existingDefinitionId = document.getElementById('existingDefinition').value;
            const selectedDef = this.existingDefinitions.find(d => d.id == this.formData.existingDefinitionId);
            if (selectedDef) {
                Object.assign(this.formData, selectedDef);
            }
        } else {
            this.formData.market = document.getElementById('market').value;
            this.formData.location = document.getElementById('location').value;
            this.formData.product = document.getElementById('product').value;
            this.formData.curveType = document.getElementById('curveType').value;
            this.formData.batteryDuration = document.getElementById('batteryDuration').value;
            this.formData.scenario = document.getElementById('scenario').value;
            this.formData.granularity = document.getElementById('granularity').value;
        }

        // Curve Instance
        this.formData.curveCreator = document.getElementById('curveCreator').value;
        this.formData.instanceVersion = document.getElementById('instanceVersion').value;
        this.formData.deliveryPeriodStart = document.getElementById('deliveryPeriodStart').value;
        this.formData.deliveryPeriodEnd = document.getElementById('deliveryPeriodEnd').value;
        this.formData.modelType = document.getElementById('modelType').value;

        const degradationOption = document.querySelector('input[name="degradationOption"]:checked').value;
        this.formData.degradationStartDate = degradationOption === 'date' ? 
            document.getElementById('degradationStartDate').value : null;

        // Delivery Request
        this.formData.dueDate = document.getElementById('dueDate').value;
        this.formData.requestedBy = document.getElementById('requestedBy').value;
        this.formData.priority = document.getElementById('priority').value;
        this.formData.responsibleTeam = document.getElementById('responsibleTeam').value;
        this.formData.deliveryFormat = document.getElementById('deliveryFormat').value;
        this.formData.notes = document.getElementById('notes').value;
    }

    generatePreviewContent() {
        const content = document.getElementById('previewContent');
        content.innerHTML = `
            <div class="space-y-4">
                <!-- Curve Definition -->
                <div class="border-l-4 border-blue-500 pl-4">
                    <h4 class="font-bold text-blue-700">🏗️ Curve Definition</h4>
                    <div class="text-sm space-y-1">
                        <p><strong>Type:</strong> ${this.formData.definitionOption === 'existing' ? 'Existing Definition' : 'New Definition'}</p>
                        <p><strong>Market:</strong> ${this.formData.market}</p>
                        <p><strong>Location:</strong> ${this.formData.location}</p>
                        <p><strong>Product:</strong> ${this.formData.product}</p>
                        <p><strong>Curve Type:</strong> ${this.formData.curveType}</p>
                        <p><strong>Battery Duration:</strong> ${this.formData.batteryDuration}</p>
                        <p><strong>Scenario:</strong> ${this.formData.scenario}</p>
                    </div>
                </div>

                <!-- Curve Instance -->
                <div class="border-l-4 border-green-500 pl-4">
                    <h4 class="font-bold text-green-700">📈 Curve Instance</h4>
                    <div class="text-sm space-y-1">
                        <p><strong>Creator:</strong> ${this.formData.curveCreator}</p>
                        <p><strong>Version:</strong> ${this.formData.instanceVersion}</p>
                        <p><strong>Granularity:</strong> ${this.formData.granularity}</p>
                        <p><strong>Delivery Period:</strong> ${new Date(this.formData.deliveryPeriodStart).toLocaleDateString()} - ${new Date(this.formData.deliveryPeriodEnd).toLocaleDateString()}</p>
                        ${this.formData.modelType ? `<p><strong>Model Type:</strong> ${this.formData.modelType}</p>` : ''}
                        ${this.formData.degradationStartDate ? `<p><strong>Degradation Starts:</strong> ${new Date(this.formData.degradationStartDate).toLocaleDateString()}</p>` : '<p><strong>Degradation:</strong> None</p>'}
                    </div>
                </div>

                <!-- Delivery Request -->
                <div class="border-l-4 border-purple-500 pl-4">
                    <h4 class="font-bold text-purple-700">📋 Delivery Request</h4>
                    <div class="text-sm space-y-1">
                        <p><strong>Due Date:</strong> ${new Date(this.formData.dueDate).toLocaleDateString()}</p>
                        <p><strong>Requested By:</strong> ${this.formData.requestedBy}</p>
                        <p><strong>Priority:</strong> ${this.formData.priority} ${this.getPriorityLabel(this.formData.priority)}</p>
                        <p><strong>Responsible Team:</strong> ${this.formData.responsibleTeam}</p>
                        <p><strong>Delivery Format:</strong> ${this.formData.deliveryFormat}</p>
                        ${this.formData.notes ? `<p><strong>Notes:</strong> ${this.formData.notes}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getPriorityLabel(priority) {
        const labels = {
            '1': '(Low)',
            '2': '(Below Normal)',
            '3': '(Normal)',
            '4': '(High)',
            '5': '(Critical)'
        };
        return labels[priority] || '';
    }

    // ========== FORM SUBMISSION ==========
    async handleSubmit(event) {
        event.preventDefault();
        
        this.hidePreview();
        this.showLoadingState();

        try {
            const response = await fetch('/api/delivery-request/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccessMessage(result);
            } else {
                this.showErrorMessage(result.error || 'Failed to create delivery request');
            }
        } catch (error) {
            this.showErrorMessage('Network error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    // ========== UI FEEDBACK ==========
    showLoadingState() {
        document.getElementById('loadingState').classList.remove('hidden');
    }

    hideLoadingState() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showSuccessMessage(result) {
        alert(`✅ Delivery request created successfully!\n\nRequest ID: ${result.deliveryRequestId}\n\nRedirecting to management dashboard...`);
        window.location.href = '/curve-schedule/manage';
    }

    showErrorMessage(error) {
        alert(`❌ Error creating delivery request:\n\n${error}\n\nPlease check your inputs and try again.`);
    }

    showValidationError(message) {
        alert(`⚠️ Validation Error:\n\n${message}`);
    }
}

// Initialize the form when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.deliveryRequestForm = new DeliveryRequestForm();
}); 