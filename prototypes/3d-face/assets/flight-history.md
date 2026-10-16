# Completed-flight route data

Source: owner's Flighty CSV export, retrieved through Flighty → Settings → Account Data → Export Your Flights on 14 October 2026. The raw export is stored outside this repository.

The artifact contains **26 completed flights across 23 directed routes**. One upcoming flight was excluded. Only airport coordinates and aggregate counts are retained; there are no booking references, dates, seats, registration numbers, notes or contact details. Routes represent elevated great-circle connections between airports, not recorded aircraft tracks.

Airport coordinates: [OurAirports](https://ourairports.com/data/), public domain, downloaded 14 October 2026.

To refresh with another authorized export:

```sh
python3 prototypes/3d-face/scripts/import_flighty.py /path/outside/repository/FlightyExport.csv
```

Use `--airports /path/to/airports.csv` for an offline OurAirports catalog. Current/future dates are excluded. Yesterday is included only with an actual landing/arrival record. Explicit non-completed status and cancellations are excluded. Unknown airports fail the import without overwriting the artifact.
