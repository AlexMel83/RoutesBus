import routesJson from './routesData.json';
import schedulesData from './routesData_obrazec.json';

// Types
export interface Stop {
    id: string;
    name: string;
    lat: number;
    lng: number;
    description?: string;
}

export interface Route {
    id: string;
    name: string;
    color: string;
    path: [number, number][];
}

export interface Arrival {
    routeId: string;
    routeName: string;
    color: string;
    minutes: number;
    time: string;
    destination?: string;
}

// 1. Static Dictionary of Coordinates
const COORDINATES: Record<string, { lat: number, lng: number }> = {
    'центр': { lat: 49.7556, lng: 27.2208 },
    'вокзал і': { lat: 49.7629, lng: 27.2115 },
    'вокзал іі': { lat: 49.7685, lng: 27.2340 },
    'вокзал ii': { lat: 49.7685, lng: 27.2340 },
    'вокзал i': { lat: 49.7629, lng: 27.2115 },
    'лікарня': { lat: 49.7420, lng: 27.2140 },
    'ринок': { lat: 49.7525, lng: 27.2245 },
    'болгарське містечко': { lat: 49.7630, lng: 27.2280 },
    'болгарський': { lat: 49.7630, lng: 27.2280 },
    'болг. містечко': { lat: 49.7630, lng: 27.2280 },
    'новики': { lat: 49.7750, lng: 27.2000 },
    'замок острозьких': { lat: 49.7585, lng: 27.2300 },
    'атп': { lat: 49.7600, lng: 27.2000 },
    'кпу': { lat: 49.7500, lng: 27.2400 },
    'магазин №1': { lat: 49.7650, lng: 27.2200 },
    "п'ятачок": { lat: 49.7480, lng: 27.2200 },
    'с. пашківці': { lat: 49.7400, lng: 27.1800 },
    'с.пашківці': { lat: 49.7400, lng: 27.1800 },
    'с/г техніка': { lat: 49.7700, lng: 27.2500 },
    'відгодівельний радгосп': { lat: 49.7800, lng: 27.2400 },
    'камянка': { lat: 49.7300, lng: 27.2100 },
    'с.кам’янка': { lat: 49.7300, lng: 27.2100 },
    'кінотеатр': { lat: 49.7560, lng: 27.2150 },
    'олійно- екстракційних завод': { lat: 49.7400, lng: 27.2500 },
    'олійно-екстракційний завод': { lat: 49.7400, lng: 27.2500 },
    '3 польовий': { lat: 49.7750, lng: 27.2100 },
    '26 б.комісарів': { lat: 49.7650, lng: 27.1950 },
    'райшрбу': { lat: 49.7450, lng: 27.2350 },
    'вул. толстого': { lat: 49.7720, lng: 27.2300 },
    'дружба': { lat: 49.7550, lng: 27.2500 },
    'анастасія': { lat: 49.7600, lng: 27.2220 }
};

const ROUTE_COLORS: Record<string, string> = {
    '1': '#ef4444',
    '2': '#f97316',
    '3': '#eab308',
    '5': '#3b82f6',
    '7': '#8b5cf6',
    '8': '#10b981',
    '9': '#ec4899',
    '10': '#14b8a6',
    'default': '#6b7280'
};

const normalize = (str: string) => {
    return str.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[.,'"«»’()]/g, '')
        .replace(/[іii]/g, 'i') // Roman i, Cyrillic i, and another variation
        .replace(/болг/g, 'болгарське')
        .replace(/бкомісарів/g, 'бакинськихкомісарів')
        .replace(/відг/g, 'відгодівельний')
        .replace(/радгос/g, 'радгосп')
        .trim();
};

const getCoords = (name: string) => {
    const normName = normalize(name);
    // Direct check in COORDINATES with normalized keys
    for (const key of Object.keys(COORDINATES)) {
        if (normalize(key) === normName) {
            return COORDINATES[key];
        }
    }
    // Partial check
    const key = Object.keys(COORDINATES).find(k => {
        const normK = normalize(k);
        return normName.includes(normK) || normK.includes(normName);
    });
    if (key) return COORDINATES[key];
    return null;
};

// 2. Process Stops (Driving from the schedule data to ensure matches)
const processedStopsMap = new Map<string, Stop>();

// Populate STOPS from schedulesData (the source of truth for arrivals)
(schedulesData as any[]).forEach(s => {
    const coords = getCoords(s.stop_name);
    if (coords) {
        processedStopsMap.set(s.stop_name, {
            id: s.stop_name,
            name: s.stop_name,
            lat: coords.lat,
            lng: coords.lng,
            description: `Stop in Starokostiantyniv`
        });
    } else {
        console.warn(`No coordinates found for stop: ${s.stop_name}`);
    }
});

export const ROUTES: Route[] = [];
export const STOPS = Array.from(processedStopsMap.values());

// 3. Daily Schedule Logic (Full Day)
export function getArrivalsForStop(stopName: string): Arrival[] {
    const now = new Date();
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayKey = daysMap[now.getDay()];

    const arrivals: Arrival[] = [];

    // Find the stop in the dataset using normalization for robustness
    const stopList = schedulesData as any[];
    const normalizedSearchName = normalize(stopName);
    const targetStop = stopList.find(s => normalize(s.stop_name) === normalizedSearchName);

    if (!targetStop) {
        console.warn(`Target stop not found in schedule data: ${stopName} (normalized: ${normalizedSearchName})`);
    }

    if (targetStop && targetStop.routes) {
        targetStop.routes.forEach((route: any) => {
            const match = route.route_name.match(/№\s*(\d+)/);
            const routeId = match ? match[1] : '?';

            if (route.schedules) {
                route.schedules.forEach((schedule: any) => {
                    if (schedule.days && (schedule.days as any)[todayKey]) {
                        const parts = (schedule.time as string).split(':').map(Number);
                        const h = parts[0] || 0;
                        const m = parts[1] || 0;
                        const minutesFromMidnight = h * 60 + m;
                        const colors = ROUTE_COLORS as Record<string, string>;

                        arrivals.push({
                            routeId: routeId,
                            routeName: route.route_name as string,
                            color: (colors[routeId] || colors['default']) as string,
                            minutes: minutesFromMidnight,
                            time: schedule.time as string,
                            destination: 'See Route'
                        });
                    }
                });
            }
        });
    }

    return arrivals.sort((a, b) => a.minutes - b.minutes);
}
