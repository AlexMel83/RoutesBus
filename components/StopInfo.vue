<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { type Stop, getArrivalsForStop, getRoutesForStop, ROUTE_COLORS } from '~/utils/mockData';

const props = defineProps<{
  stop: Stop | null;
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

// 1. Reactive State
const selectedDateTime = ref('');
const availableRoutes = ref<string[]>([]);
const selectedRoutes = ref<string[]>([]);
const loading = ref(false);

const uaDays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const dayName = computed(() => {
    if (!selectedDateTime.value) return '';
    const date = new Date(selectedDateTime.value);
    return uaDays[date.getDay()];
});

// Initialize default date/time on mount and when stop changes
const resetToCurrent = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    selectedDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
};

onMounted(() => {
    resetToCurrent();
});

watch(() => props.stop, (newStop) => {
  if (newStop) {
    availableRoutes.value = getRoutesForStop(newStop.name);
    selectedRoutes.value = [...availableRoutes.value];
    resetToCurrent();
  }
});

// 2. Computed Data
const rawArrivals = computed(() => {
    if (!props.stop) return [];
    const date = new Date(selectedDateTime.value);
    return getArrivalsForStop(props.stop.name, date);
});

const filteredArrivals = computed(() => {
    return rawArrivals.value.filter(a => selectedRoutes.value.includes(a.routeId));
});

const highlightedArrivalIndices = computed(() => {
    if (filteredArrivals.value.length === 0) return [];
    
    const selDate = new Date(selectedDateTime.value);
    const selMinutes = selDate.getHours() * 60 + selDate.getMinutes();
    
    const exactMatches = filteredArrivals.value
        .map((a, i) => a.minutes === selMinutes ? i : -1)
        .filter(i => i !== -1);
    
    if (exactMatches.length > 0) return exactMatches;

    let beforeIdx = -1;
    let afterIdx = -1;
    
    for (let i = 0; i < filteredArrivals.value.length; i++) {
        const item = filteredArrivals.value[i];
        if (item) {
            if (item.minutes < selMinutes) {
                beforeIdx = i;
            } else if (item.minutes > selMinutes) {
                afterIdx = i;
                break;
            }
        }
    }
    
    const result: number[] = [];
    if (beforeIdx !== -1) result.push(beforeIdx);
    if (afterIdx !== -1) result.push(afterIdx);
    return result;
});

const getRouteStyle = (rid: string) => {
    const isSelected = selectedRoutes.value.includes(rid);
    const color = (ROUTE_COLORS as any)[rid] || ROUTE_COLORS['default'];
    return {
        backgroundColor: isSelected ? color : 'rgba(255, 255, 255, 0.07)',
        borderColor: isSelected ? color : 'rgba(255, 255, 255, 0.15)',
        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
    };
};
</script>

<template>
  <div class="stop-panel-container" :class="{ 'open': isOpen }">
    <div class="stop-panel">
      <!-- Fixed Header -->
      <div class="fixed-header">
        <div class="header">
          <h2 v-if="stop">{{ stop.name }}</h2>
          <button class="close-btn" @click="emit('close')">×</button>
        </div>
      </div>

      <div class="scrollable-content" v-if="stop">
        <div class="controls-section">
            <div class="control-group">
                <label for="datetime">Час ({{ dayName }})</label>
                <input 
                    type="datetime-local" 
                    id="datetime" 
                    v-model="selectedDateTime"
                    class="custom-input"
                    lang="uk-UA"
                    step="60"
                />
            </div>

            <div class="control-group">
                <label>Маршрути</label>
                <div class="route-checkboxes">
                    <label v-for="rid in availableRoutes" :key="rid" class="pill-checkbox">
                        <input type="checkbox" :value="rid" v-model="selectedRoutes" />
                        <span class="pill-text" :style="getRouteStyle(rid)">{{ rid }}</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="arrivals-list">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
          </div>
          <div v-else-if="filteredArrivals.length > 0" class="arrival-items-list">
            <div 
              v-for="(arrival, index) in filteredArrivals" 
              :key="index"
              class="arrival-row"
              :class="{ 'highlighted': highlightedArrivalIndices.includes(index) }"
            >
              <div class="arrival-time">{{ arrival.time }}</div>
              <div class="route-badge-container" :style="{ backgroundColor: arrival.color }">
                <span class="route-num">{{ arrival.routeId }}</span>
              </div>
              <div class="route-text" :title="arrival.routeName">
                {{ arrival.routeName.replace(/"/g, '') }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            Рейсів не знайдено
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
  padding: 10px;
  pointer-events: none;
  display: flex;
  justify-content: center;
}

.stop-panel-container.open {
  transform: translateY(0);
}

.stop-panel {
  width: 100%;
  max-width: 440px;
  background-color: #0f172a !important; /* Force dark background */
  pointer-events: auto;
  border-radius: 12px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  color: #ffffff !important; /* Force white text */
}

.fixed-header {
  padding: 10px 14px;
  background-color: #1e293b !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scrollable-content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
  background-color: #0f172a !important;
}

.scrollable-content::-webkit-scrollbar { width: 4px; }
.scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.controls-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.control-group label {
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    margin-bottom: 2px;
    display: block;
}

.custom-input {
    background: rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    width: 100%;
    outline: none;
    color-scheme: dark;
}

.route-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.pill-checkbox input { display: none; }
.pill-checkbox { cursor: pointer; }

.pill-text {
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s;
}

.pill-checkbox input:checked + .pill-text {
    /* Styles are handled by :style binding for dynamic colors */
}

.arrival-row {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 4px;
  gap: 12px;
  border: 1px solid transparent;
}

.arrival-row.highlighted {
  background: rgba(59, 130, 246, 0.25);
  border-color: var(--primary);
}

.arrival-time {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff !important;
  min-width: 45px;
}

.route-badge-container {
  transform: skewX(-15deg);
  padding: 2px 10px;
  min-width: 34px;
  text-align: center;
  border-radius: 2px;
}

.route-num {
  display: block;
  transform: skewX(15deg);
  font-weight: 800;
  color: #fff;
  font-size: 0.85rem;
}

.route-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

@media (min-width: 768px) {
  .stop-panel-container {
    left: 20px;
    bottom: 20px;
    right: auto;
    width: 380px;
    transform: translateX(-150%);
  }
  .stop-panel-container.open {
    transform: translateX(0);
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 10px auto;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
