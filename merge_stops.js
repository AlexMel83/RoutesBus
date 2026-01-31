import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'utils/routesData_obrazec.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Normalization function to match duplicate stops
const normalize = (str) => str.toLowerCase().replace(/\s+/g, '').replace(/[.,'"«»’()]/g, '').trim();

const mergedStops = {};

data.forEach(stop => {
    const normName = normalize(stop.stop_name);

    // Choose the "cleanest" or first name as the key. 
    // If we already have a normalized key, merge into it.
    let targetKey = null;
    if (mergedStops[normName]) {
        targetKey = normName;
    } else {
        // Find if any existing normalized key is a substring or similar
        // For simplicity, we'll just use the normalized name as key.
        mergedStops[normName] = {
            stop_name: stop.stop_name, // Keep the first name found
            routes: {}
        };
        targetKey = normName;
    }

    // Merge routes
    stop.routes.forEach(route => {
        const routeName = route.route_name;
        if (!mergedStops[targetKey].routes[routeName]) {
            mergedStops[targetKey].routes[routeName] = [];
        }

        // Merge schedules
        route.schedules.forEach(newSched => {
            const existing = mergedStops[targetKey].routes[routeName].find(s => s.time === newSched.time);
            if (existing) {
                // Merge days
                Object.keys(newSched.days).forEach(day => {
                    if (newSched.days[day]) existing.days[day] = true;
                });
            } else {
                mergedStops[targetKey].routes[routeName].push(newSched);
            }
        });
    });
});

// Transform back to array
const result = Object.values(mergedStops).map(stop => ({
    stop_name: stop.stop_name,
    routes: Object.keys(stop.routes).map(rName => ({
        route_name: rName,
        schedules: stop.routes[rName].sort((a, b) => {
            const [aH, aM] = a.time.split(':').map(Number);
            const [bH, bM] = b.time.split(':').map(Number);
            return (aH * 60 + aM) - (bH * 60 + bM);
        })
    }))
}));

fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Merged stops. Total count: ${result.length} (was ${data.length})`);
