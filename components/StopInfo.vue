<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type Stop, getArrivalsForStop } from '~/utils/mockData';

const props = defineProps<{
  stop: Stop | null;
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const arrivals = ref<any[]>([]);
const loading = ref(false);

const refreshArrivals = () => {
  if (props.stop) {
    loading.value = true;
    // Simulate network delay
    setTimeout(() => {
      if (props.stop) {
        arrivals.value = getArrivalsForStop(props.stop.name);
      }
      loading.value = false;
    }, 500);
  }
};

const formatTimeLeft = (minutes: number) => {
  if (minutes < 60) {
    return `in ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `in ${hours}h ${mins}m`;
};

watch(() => props.stop, (newStop) => {
  if (newStop) {
    refreshArrivals();
  }
});
</script>

<template>
  <div class="stop-panel-container" :class="{ 'open': isOpen }">
    <div class="stop-panel glass-panel">
      <div class="panel-handle" @click="emit('close')">
        <div class="handle-bar"></div>
      </div>
      
      <div class="panel-content" v-if="stop">
        <div class="header">
          <h2>{{ stop.name }}</h2>
          <p class="description">{{ stop.description }}</p>
          <button class="close-btn-desktop" @click="emit('close')">×</button>
        </div>

        <div class="arrivals-list">
          <h3>Upcoming Arrivals</h3>
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <span>Updating real-time data...</span>
          </div>
          <div v-else-if="arrivals.length > 0" class="arrival-items-list">
            <div 
              v-for="(arrival, index) in arrivals" 
              :key="index"
              class="arrival-row"
            >
              <div class="time-group">
                <span class="arrival-time">{{ arrival.time }}</span>
                <!-- <span class="time-left">{{ formatTimeLeft(arrival.minutes) }}</span> -->
              </div>
              <div class="route-group">
                <div class="route-badge" :style="{ backgroundColor: arrival.color }">
                  {{ arrival.routeId }}
                </div>
                <span class="route-text" :title="arrival.routeName">
                  {{ arrival.routeName.replace(/"/g, '') }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            No buses scheduled for today.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stop-panel-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  transform: translateY(110%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 20px;
  pointer-events: none; /* Let clicks pass through container area not covered by panel */
  display: flex;
  justify-content: center;
}

.stop-panel-container.open {
  transform: translateY(0);
}

.stop-panel {
  width: 100%;
  max-width: 500px;
  background: var(--surface-glass);
  pointer-events: auto;
  padding: 20px;
  border-bottom-left-radius: 0; /* Looks attached to bottom on mobile? Actually floating is better */
  /* Let's keep it floating for premium feel */
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Mobile Handle */
.panel-handle {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 15px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
}

.header {
  position: relative;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-main);
}

.description {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.close-btn-desktop {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  display: none; /* Hidden on mobile usually, handle usage implies swipe/tap */
}

@media (min-width: 768px) {
  .stop-panel-container {
    left: 20px;
    bottom: 20px;
    right: auto;
    width: 400px;
    transform: translateX(-150%);
  }
  
  .stop-panel-container.open {
    transform: translateX(0);
  }
  
  .close-btn-desktop {
    display: block;
  }
  
  .panel-handle {
    display: none;
  }
}

.arrival-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.arrival-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.arrival-row:last-child {
  border-bottom: none;
}

.time-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 80px;
  margin-right: 15px;
}

.arrival-time {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.time-left {
  font-size: 0.8rem;
  color: var(--primary); /* Keep primary color for urgency */
  font-weight: 500;
  margin-top: 2px;
  background: none;
  padding: 0;
}

.route-group {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.route-badge {
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 10px;
  min-width: 30px;
  text-align: center;
  flex-shrink: 0;
}

.route-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
