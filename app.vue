<script setup lang="ts">
import { ref } from 'vue';
import type { Stop } from '~/utils/mockData';

const selectedStop = ref<Stop | null>(null);
const isPanelOpen = ref(false);
const selectedRoutes = ref<string[]>([]);

const handleSelectStop = (stop: Stop) => {
  selectedStop.value = stop;
  isPanelOpen.value = true;
};

const handleRoutesUpdate = (routes: string[]) => {
  selectedRoutes.value = routes;
};

const handleClosePanel = () => {
  isPanelOpen.value = false;
  setTimeout(() => {
    selectedStop.value = null;
  }, 300); // Clear after animation
};
</script>

<template>
  <div class="app-container">
    <div class="top-bar glass-panel">
      <h1>RoutesBus Starokostiantyniv</h1>
    </div>

    <!-- ClientOnly for Map to avoid SSR issues -->
    <ClientOnly>
      <BusMap 
        :selected-stop="selectedStop"
        :selected-routes="selectedRoutes"
        @select-stop="handleSelectStop" 
      />
      <template #placeholder>
        <div class="loading-map">
          Loading City Map...
        </div>
      </template>
    </ClientOnly>

    <StopInfo 
      :stop="selectedStop" 
      :is-open="isPanelOpen" 
      @close="handleClosePanel"
      @update:selected-routes="handleRoutesUpdate"
    />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #e5e7eb;
}

.top-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 60px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Let clicks pass through around text */
}

.top-bar h1 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-main);
  background: rgba(255,255,255,0.9);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  pointer-events: auto;
}

@media (min-width: 768px) {
  .top-bar {
    justify-content: flex-start;
    left: 20px;
    width: auto;
    right: auto;
  }
}

.loading-map {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: var(--text-secondary);
  background: #f3f4f6;
}
</style>
