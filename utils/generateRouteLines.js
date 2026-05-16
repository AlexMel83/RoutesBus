try {
    const fs = require('fs');
    const path = require('path');

    console.log('--- ROUTE GENERATOR STARTING ---');

    const dataPath = path.resolve(__dirname, 'routesData_obrazec.json');
    const outputPath = path.resolve(__dirname, 'routeLines.json');

    console.log(`Reading: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
        throw new Error(`Data file not found: ${dataPath}`);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${data.length} stops.`);

    // 1. Build coordinates map
    const stopsMap = new Map();
    for (const stop of data) {
        if (stop.coordinates) {
            const parts = stop.coordinates.split(',').map(v => parseFloat(v.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                stopsMap.set(stop.stop_name, parts);
            }
        }
    }

    // 2. Helper for time
    const t2m = (t) => {
        if (!t) return 9999;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    // 3. Collect routes
    const routesMap = new Map();

    for (const stopEntry of data) {
        if (!stopEntry.routes) continue;

        for (const rEntry of stopEntry.routes) {
            const m = rEntry.route_name.match(/№\s*(\d+)/);
            if (!m) continue;

            const id = m[1];
            if (!routesMap.has(id)) {
                routesMap.set(id, { id, name: rEntry.route_name, stops: [] });
            }

            const coords = stopsMap.get(stopEntry.stop_name);
            if (coords) {
                let minT = 9999;
                if (rEntry.schedules) {
                    for (const s of rEntry.schedules) {
                        const mins = t2m(s.time);
                        if (mins < minT) minT = mins;
                    }
                }
                routesMap.get(id).stops.push({ time: minT, coords });
            }
        }
    }

    // 4. Generate paths
    const finalRoutes = [];
    for (const route of routesMap.values()) {
        route.stops.sort((a, b) => a.time - b.time);

        const path = [];
        let prev = "";
        for (const s of route.stops) {
            const cur = s.coords.join(',');
            if (cur !== prev) {
                path.push(s.coords);
                prev = cur;
            }
        }
        finalRoutes.push({ id: route.id, name: route.name, path });
    }

    finalRoutes.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    fs.writeFileSync(outputPath, JSON.stringify(finalRoutes, null, 2));
    console.log(`--- SUCCESS: Generated ${finalRoutes.length} routes ---`);
    process.exit(0);

} catch (err) {
    console.error('!!! ERROR DURING GENERATION !!!');
    console.error(err);
    process.exit(1);
}
