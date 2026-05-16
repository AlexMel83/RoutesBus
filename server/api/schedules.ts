import { defineEventHandler } from 'h3';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/13bxKXO-CFVkvYYnrq0UnUg7nW3_AnRECorQKOSP5Nvg/export?format=csv&gid=0';

function parseCSVRow(row: string) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export default defineEventHandler(async (event) => {
  try {
    const response = await fetch(GOOGLE_SHEET_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvData = await response.text();
    
    const lines = csvData.split('\n');
    const stopsMap = new Map();
    
    let headerFound = false;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      if (!headerFound) {
        if (line.startsWith('Зупинка,')) {
          headerFound = true;
        }
        continue;
      }
      
      const fields = parseCSVRow(line);
      if (fields.length < 22) continue;
      
      const stop_name = fields[0].trim();
      const coordinates = fields[1].trim();
      const route_name = fields[2].trim();
      let time = fields[7] ? fields[7].trim() : '';
      if (!time) {
        time = fields[6] ? fields[6].trim() : '';
      }
      
      if (!stop_name || !route_name || !time) continue;
      
      time = time.replace(/^0(\d):/, '$1:');
      
      const isTrue = (val: string) => val && val.toUpperCase() === 'TRUE';
      
      const mon = isTrue(fields[15] ? fields[15].trim() : '');
      const tue = isTrue(fields[16] ? fields[16].trim() : '');
      const wed = isTrue(fields[17] ? fields[17].trim() : '');
      const thu = isTrue(fields[18] ? fields[18].trim() : '');
      const fri = isTrue(fields[19] ? fields[19].trim() : '');
      const sat = isTrue(fields[20] ? fields[20].trim() : '');
      const sun = isTrue(fields[21] ? fields[21].trim() : '');
      
      if (!stopsMap.has(stop_name)) {
        stopsMap.set(stop_name, {
          stop_name,
          coordinates,
          routesMap: new Map()
        });
      }
      
      const stopObj = stopsMap.get(stop_name);
      
      if (!stopObj.routesMap.has(route_name)) {
        stopObj.routesMap.set(route_name, {
          route_name,
          schedules: []
        });
      }
      
      const routeObj = stopObj.routesMap.get(route_name);
      
      routeObj.schedules.push({
        time,
        days: { mon, tue, wed, thu, fri, sat, sun }
      });
    }
    
    for (const stop of stopsMap.values()) {
      for (const route of stop.routesMap.values()) {
        route.schedules.sort((a: any, b: any) => {
          const [ah, am] = a.time.split(':').map(Number);
          const [bh, bm] = b.time.split(':').map(Number);
          return (ah * 60 + am) - (bh * 60 + bm);
        });
      }
    }
    
    const result = [];
    for (const stop of stopsMap.values()) {
      const routes = [];
      for (const route of stop.routesMap.values()) {
        routes.push({
          route_name: route.route_name,
          schedules: route.schedules
        });
      }
      
      result.push({
        stop_name: stop.stop_name,
        coordinates: stop.coordinates,
        routes
      });
    }
    
    return result;
  } catch (err) {
    console.error('Failed to fetch/parse routes:', err);
    return [];
  }
});
