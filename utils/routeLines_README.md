# Route Lines Configuration

This file contains the polyline paths for all bus routes.

## Format
Each route object has:
- `id`: Route number (string)
- `name`: Full route name
- `path`: Array of coordinate pairs [latitude, longitude]

## Editing
To edit a route path:
1. Find the route by its `id`
2. Edit the `path` array by adding/removing/modifying coordinates
3. Each coordinate is [latitude, longitude] format
4. Coordinates should be in the order the bus travels

## Example
```json
{
  "id": "1",
  "name": "№ 1 Вокзал І - Лікарня - Новики",
  "path": [
    [49.753285, 27.166390],  // First stop
    [49.756124, 27.189196],  // Second stop
    ...
  ]
}
```

## Tips
- Use https://www.latlong.net/ to find coordinates
- Test changes by refreshing the application
- Keep coordinates in logical order following the bus route
