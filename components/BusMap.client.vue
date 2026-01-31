<script setup lang="ts">
import { ref, onMounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import { LMap, LTileLayer, LMarker, LPolyline, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import { STOPS, ROUTES, type Stop } from '~/utils/mockData';

const zoom = ref(13);
const center = ref([49.7556, 27.2208]); // Starokostiantyniv Center
const mapOptions = {
  zoomControl: false,
  attributionControl: false
};

// Fix default icon issues by creating a custom one or just resetting
// For a premium look, let's create a custom DivIcon factory
const createIcon = (color = '#4f46e5') => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const emit = defineEmits(['select-stop']);

const onStopClick = (stop: Stop) => {
  emit('select-stop', stop);
  // Optional: Center map on click
  // center.value = [stop.lat, stop.lng]; 
};

</script>

<template>
  <div class="map-container">
    <LMap
      ref="map"
      v-model:zoom="zoom"
      v-model:center="center"
      :use-global-leaflet="false"
      :options="mapOptions"
    >
      <!-- Dark mode map style or Standard implementation -->
      <!-- Using CartoDB Voyager for a clean look -->
      <LTileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        layer-type="base"
        name="CartoDB Voyager"
      />

      <!-- Routes (Polylines) -->
      <LPolyline
        v-for="route in ROUTES"
        :key="route.id"
        :lat-lngs="route.path"
        :color="route.color"
        :weight="5"
        :opacity="0.8"
      >
        <LTooltip :sticky="true">{{ route.name }}</LTooltip>
      </LPolyline>

      <!-- Stops (Markers) -->
      <LMarker
        v-for="stop in STOPS"
        :key="stop.id"
        :lat-lng="[stop.lat, stop.lng]"
        :icon="createIcon()"
        @click="onStopClick(stop)"
      >
        <LTooltip>{{ stop.name }}</LTooltip>
      </LMarker>

    </LMap>
    
    <!-- Zoom Controls overlay if needed (custom UI preference) -->
    <div class="map-controls glass-panel">
      <button class="control-btn" @click="zoom++">+</button>
      <button class="control-btn" @click="zoom--">-</button>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.map-controls {
  position: absolute;
  bottom: 120px; /* Above the bottom sheet roughly */
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 5px;
  gap: 5px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 12px;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(0,0,0,0.05);
}
</style>
