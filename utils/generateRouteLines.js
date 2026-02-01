// Script to generate routeLines.json from routesData_obrazec.json
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'routesData_obrazec.json');
const outputPath = path.join(__dirname, 'routeLines.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Build a map of stop coordinates
const stopsMap = new Map();
data.forEach(s => {
    if (s.coordinates) {
        const parts = s.coordinates.split(',').map(v => parseFloat(v.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            stopsMap.set(s.stop_name, parts);
        }
    }
});

console.log(`Found ${stopsMap.size} stops with coordinates`);

// Build route lines by collecting all stops for each route
const routeStopsMap = new Map();

data.forEach(s => {
    if (!s.routes) return;

    s.routes.forEach(r => {
        const match = r.route_name.match(/№\s*(\d+)/);
        if (match) {
            const id = match[1];
            if (!routeStopsMap.has(id)) {
                routeStopsMap.set(id, {
                    id: id,
                    name: r.route_name,
                    stopNames: new Set()
                });
            }

            // Add this stop to the route
            routeStopsMap.get(id).stopNames.add(s.stop_name);
        }
    });
});

// Convert to final format with coordinates
const routes = Array.from(routeStopsMap.values()).map(route => {
    const path = [];
    route.stopNames.forEach(stopName => {
        const coords = stopsMap.get(stopName);
        if (coords) {
            path.push(coords);
        }
    });

    return {
        id: route.id,
        name: route.name,
        path: path
    };
});

fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2), 'utf8');
console.log(`✓ Generated ${routes.length} routes to ${outputPath}`);
routes.forEach(r => {
    console.log(`  Route ${r.id}: ${r.path.length} stops`);
});
