<template>
  <div 
    class="reservation-item"
    :class="{
      'confirmed': reservation.confirmed,
      'unconfirmed': !reservation.confirmed,
      'type-plenary': reservation.type === 'plenary',
      'type-technical': reservation.type === 'technical', 
      'type-working-group': reservation.type === 'working_group',
      'type-side-event': reservation.type === 'side_event'
    }"
    @click="onReservationClick"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <div class="reservation-content">
      <div class="reservation-title">{{ reservation.title }}</div>
      <div class="reservation-time">
        {{ formatTime(reservation.start) }} - {{ formatTime(reservation.end) }}
      </div>
      <div v-if="reservation.organizer" class="reservation-organizer">
        {{ reservation.organizer }}
      </div>
    </div>
    
    <!-- Status indicator -->
    <div class="reservation-status">
      <i 
        v-if="!reservation.confirmed" 
        class="bi bi-exclamation-triangle text-warning"
        title="Unconfirmed reservation"
      ></i>
      <i 
        v-else 
        class="bi bi-check-circle text-success"
        title="Confirmed reservation"
      ></i>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Reservation {
  id: string
  title: string
  start: string
  end: string
  roomId: string
  confirmed?: boolean
  type?: string
  organizer?: string
  description?: string
  attendees?: number
}

const props = defineProps<{
  reservation: Reservation
}>()

const emit = defineEmits<{
  click: [reservation: Reservation]
  tooltip: [reservation: Reservation, show: boolean]
}>()

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const onReservationClick = () => {
  emit('click', props.reservation)
}

const showTooltip = () => {
  emit('tooltip', props.reservation, true)
}

const hideTooltip = () => {
  emit('tooltip', props.reservation, false)
}
</script>

<style scoped>
.reservation-item {
  position: relative;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  margin: 1px 0;
  min-height: 30px;
  font-size: 0.85rem;
}

.reservation-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* Status-based styling */
.reservation-item.confirmed {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

.reservation-item.unconfirmed {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #212529;
  border: 2px solid #dc3545;
}

/* Type-based styling */
.reservation-item.type-plenary {
  background: linear-gradient(135deg, #6f42c1, #5a2d91);
  color: white;
}

.reservation-item.type-technical {
  background: linear-gradient(135deg, #20c997, #17a085);
  color: white;
}

.reservation-item.type-working-group {
  background: linear-gradient(135deg, #fd7e14, #e8590c);
  color: white;
}

.reservation-item.type-side-event {
  background: linear-gradient(135deg, #6610f2, #520dc2);
  color: white;
}

.reservation-content {
  flex-grow: 1;
  overflow: hidden;
}

.reservation-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.reservation-time {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 1px;
}

.reservation-organizer {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reservation-status {
  margin-left: 4px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .reservation-item {
    font-size: 0.8rem;
  }
  
  .reservation-title {
    font-size: 0.8rem;
  }
  
  .reservation-time {
    font-size: 0.7rem;
  }
  
  .reservation-organizer {
    display: none; /* Hide organizer on small screens */
  }
}
</style>