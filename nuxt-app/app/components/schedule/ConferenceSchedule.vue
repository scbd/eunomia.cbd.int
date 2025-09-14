<template>
  <div class="conference-schedule">
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center" style="height: 300px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading schedule...</span>
      </div>
    </div>

    <!-- Main Schedule Grid -->
    <div v-else class="schedule-container">
      <!-- Control Header -->
      <div class="control-header p-3 mb-3">
        <div class="row align-items-center">
          <div class="col-md-3">
            <label for="dayFilter" class="form-label text-white">Day</label>
            <select 
              id="dayFilter" 
              v-model="selectedDay" 
              class="form-select" 
              @change="onDayChange"
            >
              <option v-for="day in conferenceDays" :key="day.value" :value="day.value">
                {{ day.label }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="startTimeFilter" class="form-label text-white">Start Time</label>
            <select 
              id="startTimeFilter" 
              v-model="selectedStartTime" 
              class="form-select"
              @change="onStartTimeChange"
            >
              <option v-for="time in availableStartTimes" :key="time.value" :value="time.value">
                {{ time.label }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="endTimeFilter" class="form-label text-white">End Time</label>
            <select 
              id="endTimeFilter" 
              v-model="selectedEndTime" 
              class="form-select"
              @change="onEndTimeChange"
            >
              <option v-for="time in availableEndTimes" :key="time.value" :value="time.value">
                {{ time.label }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <div class="d-flex gap-2 mt-4">
              <button 
                class="btn btn-outline-light btn-sm" 
                @click="toggleEmptyRooms"
                :title="hideEmptyRooms ? 'Show empty rooms' : 'Hide empty rooms'"
              >
                <i :class="hideEmptyRooms ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
              </button>
              <button 
                class="btn btn-outline-light btn-sm" 
                @click="refreshSchedule"
                title="Refresh schedule"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Grid -->
      <div class="schedule-grid">
        <div class="d-flex">
          <!-- Room Column -->
          <div class="room-column">
            <div class="room-column-header text-center">
              <strong>Rooms</strong>
              <div class="mt-1">
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  @click="toggleEmptyRooms"
                  :title="hideEmptyRooms ? 'Show empty rooms' : 'Hide empty rooms'"
                >
                  <i :class="hideEmptyRooms ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
                </button>
              </div>
            </div>
            <div class="rooms-list">
              <div 
                v-for="(room, index) in visibleRooms" 
                :key="room.id"
                class="room-row"
                :class="{ 'row-stripped': index % 2 === 0 }"
              >
                <div class="room-info">
                  <div class="room-name">{{ room.name }}</div>
                  <div class="room-details text-muted small">
                    Capacity: {{ room.capacity || 'N/A' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Grid -->
          <div class="time-grid flex-grow-1">
            <!-- Time Header -->
            <div class="time-header">
              <div 
                v-for="timeSlot in timeSlots" 
                :key="timeSlot.value"
                class="time-slot"
                :style="{ width: timeSlotWidth + 'px' }"
              >
                {{ timeSlot.label }}
              </div>
            </div>
            
            <!-- Current Time Indicator -->
            <div 
              v-if="currentTimePosition >= 0"
              class="current-time-line"
              :style="{ left: currentTimePosition + 'px' }"
            ></div>

            <!-- Room Time Rows -->
            <div class="room-time-rows">
              <div 
                v-for="(room, roomIndex) in visibleRooms" 
                :key="room.id"
                class="room-time-row"
                :class="{ 'row-stripped': roomIndex % 2 === 0 }"
              >
                <!-- Reservations for this room -->
                <div 
                  v-for="reservation in getRoomReservations(room.id)" 
                  :key="reservation.id"
                  class="reservation"
                  :class="{ 'unconfirmed': !reservation.confirmed }"
                  :style="getReservationStyle(reservation)"
                  @click="onReservationClick(reservation)"
                >
                  <div class="reservation-content">
                    <div class="reservation-title">{{ reservation.title }}</div>
                    <div class="reservation-time">
                      {{ formatTime(reservation.start) }} - {{ formatTime(reservation.end) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Room {
  id: string
  name: string
  capacity?: number
  sort?: number
  hideRoomSearch?: string | number
}

interface Reservation {
  id: string
  title: string
  start: string
  end: string
  roomId: string
  confirmed?: boolean
  type?: string
}

interface ConferenceDay {
  value: string
  label: string
}

interface TimeSlot {
  value: string
  label: string
}

const props = defineProps<{
  conference: any
  search?: string
}>()

// Reactive state
const isLoading = ref(true)
const rooms = ref<Room[]>([])
const reservations = ref<Reservation[]>([])
const hideEmptyRooms = ref(false)
const selectedDay = ref('')
const selectedStartTime = ref('')
const selectedEndTime = ref('')
const currentTime = ref(new Date())

// Sample data for development
const sampleRooms: Room[] = [
  { id: '1', name: 'Main Hall', capacity: 500, sort: 1 },
  { id: '2', name: 'Conference Room A', capacity: 100, sort: 2 },
  { id: '3', name: 'Conference Room B', capacity: 80, sort: 3 },
  { id: '4', name: 'Meeting Room 1', capacity: 20, sort: 4 },
  { id: '5', name: 'Meeting Room 2', capacity: 20, sort: 5 }
]

const sampleReservations: Reservation[] = [
  {
    id: '1',
    title: 'Opening Session',
    start: '2024-01-15T09:00:00',
    end: '2024-01-15T10:30:00',
    roomId: '1',
    confirmed: true
  },
  {
    id: '2',
    title: 'Technical Session 1',
    start: '2024-01-15T11:00:00',
    end: '2024-01-15T12:30:00',
    roomId: '2',
    confirmed: true
  },
  {
    id: '3',
    title: 'Working Group Meeting',
    start: '2024-01-15T14:00:00',
    end: '2024-01-15T15:30:00',
    roomId: '4',
    confirmed: false
  }
]

// Computed properties
const conferenceDays = computed<ConferenceDay[]>(() => {
  // In real implementation, this would come from the conference data
  return [
    { value: '2024-01-15', label: 'Monday, January 15' },
    { value: '2024-01-16', label: 'Tuesday, January 16' },
    { value: '2024-01-17', label: 'Wednesday, January 17' }
  ]
})

const availableStartTimes = computed<TimeSlot[]>(() => {
  const times = []
  for (let hour = 8; hour <= 18; hour++) {
    times.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return times
})

const availableEndTimes = computed<TimeSlot[]>(() => {
  const times = []
  for (let hour = 9; hour <= 20; hour++) {
    times.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return times
})

const timeSlots = computed<TimeSlot[]>(() => {
  const slots = []
  const start = parseInt(selectedStartTime.value.split(':')[0]) || 8
  const end = parseInt(selectedEndTime.value.split(':')[0]) || 18
  
  for (let hour = start; hour <= end; hour++) {
    slots.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return slots
})

const timeSlotWidth = 100 // pixels per hour

const visibleRooms = computed(() => {
  if (hideEmptyRooms.value) {
    return rooms.value.filter(room => hasReservations(room.id))
  }
  return rooms.value.sort((a, b) => (a.sort || 0) - (b.sort || 0))
})

const currentTimePosition = computed(() => {
  const now = new Date()
  const startHour = parseInt(selectedStartTime.value.split(':')[0]) || 8
  const currentHour = now.getHours() + now.getMinutes() / 60
  
  if (currentHour < startHour || currentHour > parseInt(selectedEndTime.value.split(':')[0]) || 18) {
    return -1 // Outside visible time range
  }
  
  return (currentHour - startHour) * timeSlotWidth
})

// Methods
const hasReservations = (roomId: string): boolean => {
  return reservations.value.some(res => res.roomId === roomId)
}

const getRoomReservations = (roomId: string): Reservation[] => {
  return reservations.value.filter(res => res.roomId === roomId)
}

const getReservationStyle = (reservation: Reservation) => {
  const start = new Date(reservation.start)
  const end = new Date(reservation.end)
  const startHour = parseInt(selectedStartTime.value.split(':')[0]) || 8
  
  const startOffset = (start.getHours() + start.getMinutes() / 60 - startHour) * timeSlotWidth
  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
  const width = duration * timeSlotWidth
  
  return {
    left: `${startOffset}px`,
    width: `${width}px`,
    position: 'absolute',
    top: '2px',
    height: 'calc(100% - 4px)'
  }
}

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const onDayChange = () => {
  loadReservations()
}

const onStartTimeChange = () => {
  // Validate that start time is before end time
  const start = parseInt(selectedStartTime.value.split(':')[0])
  const end = parseInt(selectedEndTime.value.split(':')[0])
  
  if (start >= end) {
    selectedEndTime.value = `${(start + 1).toString().padStart(2, '0')}:00`
  }
}

const onEndTimeChange = () => {
  // Validate that end time is after start time
  const start = parseInt(selectedStartTime.value.split(':')[0])
  const end = parseInt(selectedEndTime.value.split(':')[0])
  
  if (end <= start) {
    selectedStartTime.value = `${(end - 1).toString().padStart(2, '0')}:00`
  }
}

const toggleEmptyRooms = () => {
  hideEmptyRooms.value = !hideEmptyRooms.value
}

const refreshSchedule = async () => {
  isLoading.value = true
  await loadRooms()
  await loadReservations()
  isLoading.value = false
}

const onReservationClick = (reservation: Reservation) => {
  // Handle reservation click - could open edit modal, navigate to details, etc.
  console.log('Reservation clicked:', reservation)
}

const loadRooms = async () => {
  try {
    const response = await $fetch(`/api/schedule/${props.conference.institution}/${props.conference.code}`, {
      query: {
        day: selectedDay.value,
        startTime: selectedStartTime.value,
        endTime: selectedEndTime.value
      }
    })
    
    if (response.success && response.data) {
      rooms.value = response.data.rooms || []
      reservations.value = response.data.reservations || []
    }
  } catch (error) {
    console.error('Failed to load schedule data:', error)
    // Fallback to sample data in case of error
    rooms.value = sampleRooms
    reservations.value = sampleReservations
  }
}

const loadReservations = async () => {
  // This is now handled in loadRooms to reduce API calls
  await loadRooms()
}

// Initialize component on mount
onMounted(async () => {
  // Set default values
  selectedDay.value = conferenceDays.value[0]?.value || ''
  selectedStartTime.value = '08:00'
  selectedEndTime.value = '18:00'
  
  // Load initial data
  await loadRooms()
  isLoading.value = false
  
  // Update current time every minute
  setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})
</script>

<style scoped>
.conference-schedule {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.control-header {
  background-color: #6c757d;
  border-radius: 0.375rem;
}

.schedule-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.schedule-grid {
  flex-grow: 1;
  overflow: hidden;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.room-column {
  width: 200px;
  border-right: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.room-column-header {
  height: 50px;
  padding: 10px;
  background-color: #e9ecef;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.rooms-list {
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

.room-row {
  min-height: 60px;
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
}

.row-stripped {
  background-color: #f8f9fa;
}

.room-info {
  width: 100%;
}

.room-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.room-details {
  font-size: 0.8rem;
  margin-top: 2px;
}

.time-grid {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
}

.time-header {
  height: 50px;
  display: flex;
  background-color: #e9ecef;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 9;
}

.time-slot {
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 100px;
}

.room-time-rows {
  position: relative;
}

.room-time-row {
  min-height: 60px;
  border-bottom: 1px solid #dee2e6;
  position: relative;
}

.current-time-line {
  position: absolute;
  top: 50px;
  bottom: 0;
  width: 2px;
  background-color: #dc3545;
  z-index: 5;
  pointer-events: none;
}

.current-time-line::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -4px;
  width: 10px;
  height: 10px;
  background-color: #dc3545;
  border-radius: 50%;
}

.reservation {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.reservation:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.reservation.unconfirmed {
  border: 2px solid #dc3545;
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #212529;
}

.reservation-content {
  padding: 4px 8px;
  overflow: hidden;
}

.reservation-title {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reservation-time {
  font-size: 0.75rem;
  opacity: 0.9;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .room-column {
    width: 150px;
  }
  
  .time-slot {
    min-width: 80px;
    font-size: 0.8rem;
  }
  
  .control-header .row > div {
    margin-bottom: 1rem;
  }
}
</style>