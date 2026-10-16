#!/usr/bin/env python3
"""Reduce a private Flighty CSV export to completed-flight route geometry.

Only airport coordinates and aggregate counts enter the public artifact.
The source CSV is read in place and never copied into the project.
"""
import argparse
import csv
import datetime as dt
import io
import json
from pathlib import Path
import urllib.request

AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv'


def airport_index(text):
    result = {}
    for row in csv.DictReader(io.StringIO(text)):
        code = row.get('iata_code', '').strip().upper()
        if len(code) != 3 or row.get('type') == 'closed':
            continue
        try:
            point = [float(row['longitude_deg']), float(row['latitude_deg'])]
        except (KeyError, ValueError):
            continue
        if -180 <= point[0] <= 180 and -90 <= point[1] <= 90:
            if code in result and result[code] != point:
                raise ValueError(f'Ambiguous airport code: {code}')
            result[code] = point
    return result


def completed_routes(text, airports, today):
    reader = csv.DictReader(io.StringIO(text.lstrip('\ufeff')))
    if not {'Date', 'From', 'To'}.issubset(reader.fieldnames or []):
        raise ValueError('Expected Flighty columns: Date, From, To')
    routes, seen, missing = {}, set(), set()
    excluded = 0
    for row in reader:
        try:
            date = dt.date.fromisoformat(row['Date'].strip())
        except ValueError:
            excluded += 1
            continue
        # No current/future travel. A full UTC day of margin avoids counting
        # a long-haul flight that is still in progress across the date line.
        arrived = bool((row.get('Gate Arrival (Actual)') or row.get('Landing (Actual)') or '').strip())
        if date >= today or (date == today-dt.timedelta(days=1) and not arrived) or row.get('Canceled', '').strip().lower() in {'true', 'yes', '1'}:
            excluded += 1
            continue
        status = row.get('Status', '').strip().lower()
        if status and status not in {'landed', 'arrived', 'completed', 'flown'}:
            excluded += 1
            continue
        origin = row['From'].strip().upper()
        destination = (row.get('Diverted To') or row['To']).strip().upper()
        identity = row.get('Flight Flighty ID') or '|'.join([str(date), row.get('Airline', ''), row.get('Flight', ''), origin, destination, row.get('Gate Departure (Scheduled)', '')])
        if identity in seen:
            continue
        seen.add(identity)
        missing.update(code for code in [origin, destination] if code not in airports)
        if origin not in airports or destination not in airports:
            continue
        if origin == destination:
            excluded += 1
            continue
        key = (origin, destination)
        routes[key] = routes.get(key, 0)+1
    if missing:
        raise ValueError('Unresolved airport codes (no output written): '+', '.join(sorted(missing)))
    return {'version': 1, 'source': 'Flighty', 'flightCount': sum(routes.values()), 'routes': [
        {'from': airports[a], 'to': airports[b], 'count': count}
        for (a, b), count in sorted(routes.items())
    ]}, excluded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    parser.add_argument('--airports', type=Path, help='Optional local OurAirports airports.csv')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1]/'assets/flight-history.json')
    parser.add_argument('--as-of', type=dt.date.fromisoformat, default=dt.datetime.now(dt.timezone.utc).date())
    args = parser.parse_args()
    airport_text = args.airports.read_text(encoding='utf-8-sig') if args.airports else urllib.request.urlopen(AIRPORTS_URL, timeout=30).read().decode('utf-8-sig')
    data, excluded = completed_routes(args.csv.read_text(encoding='utf-8-sig'), airport_index(airport_text), args.as_of)
    args.output.write_text(json.dumps(data, separators=(',', ':'))+'\n', encoding='utf-8')
    print(f"Wrote {data['flightCount']} completed flights across {len(data['routes'])} routes; excluded {excluded} records.")


if __name__ == '__main__':
    main()
