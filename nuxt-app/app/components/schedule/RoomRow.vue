<template>
  <div class="room-component" :class="{ 'row-stripped': isStripped }">
    <div class="room-header">
      <div class="room-info">
        <div class="room-name">{{ room.name }}</div>
        <div class="room-details text-muted small">
          <i class="bi bi-people"></i> {{ room.capacity || 'N/A' }}
          <span v-if="room.floor" class="ms-2">
            <i class="bi bi-building"></i> {{ room.floor }}
          </span>
        </div>
        <div v-if="room.equipment?.length" class="room-equipment">
          <span 
            v-for="equipment in room.equipment.slice(0, 2)" 
            :key="equipment"
            class="badge bg-secondary me-1"
            style="font-size: 0.6rem;"
          >
            {{ formatEquipment(equipment) }}
          </span>
          <span 
            v-if="room.equipment.length > 2" 
            class="text-muted small"
          >
            +{{ room.equipment.length - 2 }} more
          </span>
        </div>
      </div>
      
      <div class="room-actions">
        <div class="reservation-count">
          <span class="badge bg-primary">{{ reservationCount }}</span>
        </div>
        <button 
          class="btn btn-sm btn-outline-secondary"
          @click="onRoomClick"
          title="View room details"
        >
          <i class="bi bi-info-circle"></i>
        </button>
      </div>
    </div>
    
    <!-- Time slots for this room -->
    <div class="room-timeline">
      <div 
        v-for="timeSlot in timeSlots" 
        :key="timeSlot.value"
        class="time-slot"
        :style="{ width: timeSlotWidth + 'px' }"
        @click="onTimeSlotClick(timeSlot)"
      >
        <!-- Reservations in this time slot -->
        <div 
          v-for="reservation in getReservationsForTimeSlot(timeSlot)" 
          :key="reservation.id"
          class="time-slot-reservation"
        >
          <ReservationItem
            :reservation="reservation"
            @click="onReservationClick"
            @tooltip="onReservationTooltip"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Room {
  id: string
  name: string
  capacity?: number
  sort?: number
  floor?: string
  equipment?: string[]
}

interface Reservation {
  id: string
  title: string
  start: string
  end: string
  roomId: string
  confirmed?: boolean
  type?: string
  organizer?: string
}

interface TimeSlot {
  value: string
  label: string
}

const props = defineProps<{
  room: Room
  reservations: Reservation[]
  timeSlots: TimeSlot[]
  timeSlotWidth: number
  isStripped?: boolean
}>()

const emit = defineEmits<{
  roomClick: [room: Room]
  timeSlotClick: [room: Room, timeSlot: TimeSlot]
  reservationClick: [reservation: Reservation]
  reservationTooltip: [reservation: Reservation, show: boolean]
}>()

const reservationCount = computed(() => {
  return props.reservations.filter(res => res.roomId === props.room.id).length
})

const formatEquipment = (equipment: string): string => {
  const equipmentMap: Record<string, string> = {
    'projector': 'Proj',
    'sound_system': 'Audio',
    'microphones': 'Mic',
    'whiteboard': 'Board',
    'tv_screen': 'TV',
    'video_conference': 'VC'
  }
  return equipmentMap[equipment] || equipment
}

const getReservationsForTimeSlot = (timeSlot: TimeSlot): Reservation[] => {
  const slotHour = parseInt(timeSlot.value.split(':')[0])
  
  return props.reservations.filter(res => {
    if (res.roomId !== props.room.id) return false
    
    const startHour = parseInt(res.start.split('T')[1].split(':')[0])
    const endHour = parseInt(res.end.split('T')[1].split(':')[0])
    
    // Check if reservation overlaps with this time slot
    return startHour <= slotHour && endHour > slotHour
  })
}

const onRoomClick = () => {
  emit('roomClick', props.room)
}

const onTimeSlotClick = (timeSlot: TimeSlot) => {
  emit('timeSlotClick', props.room, timeSlot)
}

const onReservationClick = (reservation: Reservation) => {
  emit('reservationClick', reservation)
}

const onReservationTooltip = (reservation: Reservation, show: boolean) => {
  emit('reservationTooltip', reservation, show)
}
</script>

<style scoped>
.room-component {
  display: flex;
  min-height: 60px;
  border-bottom: 1px solid #dee2e6;
  background: white;
}

.row-stripped {
  background-color: #f8f9fa;
}

.room-header {
  width: 200px;
  padding: 10px;
  border-right: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: inherit;
}

.room-info {
  flex-grow: 1;
  margin-right: 8px;
}

.room-name {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.room-details {
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.room-equipment {
  margin-top: 4px;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reservation-count {
  margin-right: 4px;
}

.room-timeline {
  flex-grow: 1;
  display: flex;
  position: relative;
}

.time-slot {
  border-right: 1px solid #dee2e6;
  position: relative;
  min-height: 58px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.time-slot:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.time-slot-reservation {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  z-index: 2;
}

@media (max-width: 768px) {
  .room-header {
    width: 150px;
    padding: 8px;
  }
  
  .room-name {
    font-size: 0.85rem;
  }
  
  .room-details {
    font-size: 0.75rem;
  }
  
  .room-equipment {
    display: none;
  }
  
  .time-slot {
    min-width: 80px;
  }
}
</style>