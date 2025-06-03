// Schedule Management Dashboard JavaScript

class ScheduleManager {
  constructor() {
    this.schedules = [];
    this.filteredSchedules = [];
    this.currentView = 'grid';
    this.selectedSchedules = new Set();
    this.calendar = null;
    
    this.initializeElements();
    this.attachEventListeners();
    this.loadSchedules();
  }

  initializeElements() {
    // View elements
    this.gridView = document.getElementById('gridView');
    this.calendarView = document.getElementById('calendarView');
    this.gridViewBtn = document.getElementById('gridViewBtn');
    this.calendarViewBtn = document.getElementById('calendarViewBtn');
    
    // State elements
    this.loadingState = document.getElementById('loadingState');
    this.gridContent = document.getElementById('gridContent');
    this.emptyState = document.getElementById('emptyState');
    this.errorState = document.getElementById('errorState');
    
    // Filter elements
    this.statusFilter = document.getElementById('statusFilter');
    this.marketFilter = document.getElementById('marketFilter');
    this.teamFilter = document.getElementById('teamFilter');
    this.curveTypeFilter = document.getElementById('curveTypeFilter');
    
    // Action elements
    this.refreshBtn = document.getElementById('refreshBtn');
    this.selectAllCheckbox = document.getElementById('selectAll');
    this.bulkActions = document.getElementById('bulkActions');
    this.bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    this.selectedCount = document.getElementById('selectedCount');
    
    // Table elements
    this.scheduleTableBody = document.getElementById('scheduleTableBody');
    
    // Summary elements
    this.totalCount = document.getElementById('totalCount');
    this.scheduledCount = document.getElementById('scheduledCount');
    this.inProgressCount = document.getElementById('inProgressCount');
    this.completedCount = document.getElementById('completedCount');
    this.overdueCount = document.getElementById('overdueCount');
    
    // Modal elements
    this.editModal = document.getElementById('editModal');
    this.editForm = document.getElementById('editForm');
    this.editScheduleId = document.getElementById('editScheduleId');
    this.cancelEditBtn = document.getElementById('cancelEdit');
  }

  attachEventListeners() {
    // View toggle
    this.gridViewBtn.addEventListener('click', () => this.switchToGridView());
    this.calendarViewBtn.addEventListener('click', () => this.switchToCalendarView());
    
    // Filters
    this.statusFilter.addEventListener('change', () => this.applyFilters());
    this.marketFilter.addEventListener('change', () => this.applyFilters());
    this.teamFilter.addEventListener('change', () => this.applyFilters());
    this.curveTypeFilter.addEventListener('change', () => this.applyFilters());
    
    // Actions
    this.refreshBtn.addEventListener('click', () => this.loadSchedules());
    this.selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e));
    this.bulkDeleteBtn.addEventListener('click', () => this.handleBulkDelete());
    
    // Modal
    this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    
    // Close modal on background click
    this.editModal.addEventListener('click', (e) => {
      if (e.target === this.editModal) {
        this.closeEditModal();
      }
    });
  }

  async loadSchedules() {
    try {
      this.showLoading();
      
      const response = await fetch('/api/curve-schedule/manage');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.schedules = data.schedules || [];
      this.updateSummaryStats(data.summary);
      this.applyFilters();
      this.hideLoading();
      
    } catch (error) {
      console.error('Error loading schedules:', error);
      this.showError(error.message);
    }
  }

  applyFilters() {
    const statusFilter = this.statusFilter.value;
    const marketFilter = this.marketFilter.value;
    const teamFilter = this.teamFilter.value;
    const curveTypeFilter = this.curveTypeFilter.value;

    this.filteredSchedules = this.schedules.filter(schedule => {
      if (statusFilter && schedule.schedule_status !== statusFilter) return false;
      if (marketFilter && schedule.market !== marketFilter) return false;
      if (teamFilter && schedule.responsibleTeam !== teamFilter) return false;
      if (curveTypeFilter && schedule.curveType !== curveTypeFilter) return false;
      return true;
    });

    if (this.currentView === 'grid') {
      this.renderScheduleTable();
    } else {
      this.renderCalendar();
    }
  }

  switchToGridView() {
    this.currentView = 'grid';
    this.gridView.classList.remove('hidden');
    this.calendarView.classList.add('hidden');
    
    // Update button styles
    this.gridViewBtn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
    this.gridViewBtn.classList.remove('text-gray-700');
    this.calendarViewBtn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
    this.calendarViewBtn.classList.add('text-gray-700');
    
    this.renderScheduleTable();
  }

  switchToCalendarView() {
    this.currentView = 'calendar';
    this.gridView.classList.add('hidden');
    this.calendarView.classList.remove('hidden');
    
    // Update button styles
    this.calendarViewBtn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
    this.calendarViewBtn.classList.remove('text-gray-700');
    this.gridViewBtn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
    this.gridViewBtn.classList.add('text-gray-700');
    
    this.renderCalendar();
  }

  renderScheduleTable() {
    if (this.filteredSchedules.length === 0) {
      this.scheduleTableBody.style.display = 'none';
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');
    this.scheduleTableBody.style.display = '';
    
    this.scheduleTableBody.innerHTML = this.filteredSchedules.map(schedule => 
      this.createScheduleRow(schedule)
    ).join('');

    // Attach event listeners to new elements
    this.attachRowEventListeners();
  }

  createScheduleRow(schedule) {
    const statusColor = this.getStatusColor(schedule.schedule_status, schedule.is_overdue);
    const priorityBadge = this.getPriorityBadge(schedule.importance);
    const nextDueDate = new Date(schedule.next_delivery_due).toLocaleDateString();

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <input type="checkbox" class="row-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                 data-schedule-id="${schedule.schedule_id}">
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-medium text-gray-900">${schedule.curveName}</div>
          <div class="text-sm text-gray-500">${schedule.curveType} • ${schedule.batteryDuration} • ${schedule.scenario}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
            ${schedule.schedule_status}
            ${schedule.is_overdue ? ' (Overdue)' : ''}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900">${schedule.market}</div>
          <div class="text-sm text-gray-500">${schedule.location}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${schedule.responsibleTeam}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${nextDueDate}
          <div class="text-xs text-gray-500">${schedule.frequency}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${priorityBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button class="edit-btn text-blue-600 hover:text-blue-900" data-schedule-id="${schedule.schedule_id}">
            Edit
          </button>
          <button class="delete-btn text-red-600 hover:text-red-900" data-schedule-id="${schedule.schedule_id}">
            Delete
          </button>
        </td>
      </tr>
    `;
  }

  getStatusColor(status, isOverdue) {
    if (isOverdue) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityBadge(importance) {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[importance] || colors[3]}">${importance}</span>`;
  }

  attachRowEventListeners() {
    // Row checkboxes
    document.querySelectorAll('.row-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.handleRowSelection(e));
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleEdit(e));
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDelete(e));
    });
  }

  renderCalendar() {
    // Ensure FullCalendar is available
    if (typeof FullCalendar === 'undefined') {
      console.warn('FullCalendar not available, retrying...');
      setTimeout(() => this.renderCalendar(), 100);
      return;
    }

    const calendarEl = document.getElementById('calendar');
    
    if (this.calendar) {
      this.calendar.destroy();
    }

    const events = this.filteredSchedules.map(schedule => ({
      id: schedule.schedule_id,
      title: `${schedule.curveName} - ${schedule.responsibleTeam}`,
      start: schedule.next_delivery_due,
      backgroundColor: this.getEventColor(schedule.schedule_status, schedule.is_overdue),
      borderColor: this.getEventColor(schedule.schedule_status, schedule.is_overdue),
      extendedProps: {
        schedule: schedule
      }
    }));

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      events: events,
      eventClick: (info) => {
        this.handleCalendarEventClick(info);
      },
      height: 'auto'
    });

    this.calendar.render();
  }

  getEventColor(status, isOverdue) {
    if (isOverdue) return '#dc2626'; // red
    
    switch (status) {
      case 'SCHEDULED': return '#2563eb'; // blue
      case 'IN_PROGRESS': return '#f59e0b'; // amber
      case 'COMPLETED': return '#059669'; // emerald
      default: return '#6b7280'; // gray
    }
  }

  handleCalendarEventClick(info) {
    const schedule = info.event.extendedProps.schedule;
    alert(`Schedule: ${schedule.curveName}\nStatus: ${schedule.schedule_status}\nTeam: ${schedule.responsibleTeam}\nNext Due: ${schedule.next_delivery_due}`);
  }

  handleRowSelection(e) {
    const scheduleId = parseInt(e.target.dataset.scheduleId);
    
    if (e.target.checked) {
      this.selectedSchedules.add(scheduleId);
    } else {
      this.selectedSchedules.delete(scheduleId);
    }
    
    this.updateBulkActions();
    this.updateSelectAllState();
  }

  handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
      const scheduleId = parseInt(checkbox.dataset.scheduleId);
      
      if (e.target.checked) {
        this.selectedSchedules.add(scheduleId);
      } else {
        this.selectedSchedules.delete(scheduleId);
      }
    });
    
    this.updateBulkActions();
  }

  updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    
    if (checkedCount === 0) {
      this.selectAllCheckbox.indeterminate = false;
      this.selectAllCheckbox.checked = false;
    } else if (checkedCount === checkboxes.length) {
      this.selectAllCheckbox.indeterminate = false;
      this.selectAllCheckbox.checked = true;
    } else {
      this.selectAllCheckbox.indeterminate = true;
    }
  }

  updateBulkActions() {
    const count = this.selectedSchedules.size;
    
    if (count > 0) {
      this.bulkActions.classList.remove('hidden');
      this.bulkActions.classList.add('flex');
      this.selectedCount.textContent = `${count} selected`;
    } else {
      this.bulkActions.classList.add('hidden');
      this.bulkActions.classList.remove('flex');
    }
  }

  async handleEdit(e) {
    const scheduleId = parseInt(e.target.dataset.scheduleId);
    const schedule = this.schedules.find(s => s.schedule_id === scheduleId);
    
    if (schedule) {
      this.openEditModal(schedule);
    }
  }

  openEditModal(schedule) {
    this.editScheduleId.value = schedule.schedule_id;
    document.getElementById('editFrequency').value = schedule.frequency;
    document.getElementById('editImportance').value = schedule.importance;
    document.getElementById('editTeam').value = schedule.responsibleTeam;
    document.getElementById('editFreshnessDays').value = schedule.freshnessDays;
    
    this.editModal.classList.remove('hidden');
  }

  closeEditModal() {
    this.editModal.classList.add('hidden');
    this.editForm.reset();
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    
    const scheduleId = parseInt(this.editScheduleId.value);
    const formData = new FormData(this.editForm);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const response = await fetch('/api/curve-schedule/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          ...data,
          importance: parseInt(data.importance),
          freshnessDays: parseInt(data.freshnessDays)
        })
      });

      if (response.ok) {
        this.closeEditModal();
        this.loadSchedules(); // Reload data
        this.showSuccess('Schedule updated successfully');
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleDelete(e) {
    const scheduleId = parseInt(e.target.dataset.scheduleId);
    
    if (confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      await this.deleteSchedule(scheduleId);
    }
  }

  async handleBulkDelete() {
    if (this.selectedSchedules.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${this.selectedSchedules.size} schedule(s)? This action cannot be undone.`)) {
      for (const scheduleId of this.selectedSchedules) {
        await this.deleteSchedule(scheduleId);
      }
      this.selectedSchedules.clear();
      this.updateBulkActions();
    }
  }

  async deleteSchedule(scheduleId) {
    try {
      const response = await fetch('/api/curve-schedule/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      });

      if (response.ok) {
        // Remove from local data
        this.schedules = this.schedules.filter(s => s.schedule_id !== scheduleId);
        this.applyFilters();
        this.showSuccess('Schedule deleted successfully');
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete schedule');
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  updateSummaryStats(summary) {
    if (summary) {
      this.totalCount.textContent = summary.total_schedules || 0;
      this.scheduledCount.textContent = summary.scheduled_count || 0;
      this.inProgressCount.textContent = summary.in_progress_count || 0;
      this.completedCount.textContent = summary.completed_count || 0;
      this.overdueCount.textContent = summary.overdue_count || 0;
    }
  }

  showLoading() {
    this.loadingState.classList.remove('hidden');
    this.gridContent.classList.add('hidden');
    this.errorState.classList.add('hidden');
  }

  hideLoading() {
    this.loadingState.classList.add('hidden');
    this.gridContent.classList.remove('hidden');
  }

  showError(message) {
    this.loadingState.classList.add('hidden');
    this.gridContent.classList.add('hidden');
    this.errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
  }

  showSuccess(message) {
    // Simple success notification (you could enhance this)
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ScheduleManager();
}); 