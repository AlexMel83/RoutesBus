import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'utils/routesData_obrazec.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Robust normalization
const normalize = (str) => {
    return str.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[.,'"«»’()]/g, '')
        .replace(/і/g, 'i') // Cyrillic i to roman i
        .replace(/болг/g, 'болгарське') // Expand
        .replace(/бкомісарів/g, 'бакинськихкомісарів')
        .trim();
};

const mergedStops = {};

data.forEach(stop => {
    let stopName = stop.stop_name.trim().replace(/^"|"$/g, '');
    // Standardize some names
    if (stopName.includes('Болг.')) stopName = 'Болгарське містечко';
    if (stopName.includes('Толстого')) stopName = 'вул. Толстого';
    if (stopName === 'Ринок') stopName = 'Ринок';

    const normName = normalize(stopName);

    if (!mergedStops[normName]) {
        mergedStops[normName] = {
            stop_name: stopName,
            routes: {}
        };
    }

    stop.routes.forEach(route => {
        const routeName = route.route_name;
        if (!mergedStops[normName].routes[routeName]) {
            mergedStops[normName].routes[routeName] = [];
        }

        route.schedules.forEach(newSched => {
            const existing = mergedStops[normName].routes[routeName].find(s => s.time === newSched.time);
            if (existing) {
                Object.keys(newSched.days).forEach(day => {
                    if (newSched.days[day]) existing.days[day] = true;
                });
            } else {
                mergedStops[normName].routes[routeName].push({ ...newSched });
            }
        });
    });
});

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
console.log(`Deep Merged stops. Total: ${result.length}`);
