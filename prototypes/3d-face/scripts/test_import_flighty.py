import datetime as dt
import unittest
from import_flighty import completed_routes


class FlightyImportTests(unittest.TestCase):
    def test_past_only_privacy_deduplication_and_diversion(self):
        text = '''Date,Airline,Flight,From,To,Canceled,Diverted To,Status,PNR,Notes
2025-01-01,TST,1,AAA,BBB,false,,landed,SECRET,Private note
2025-01-01,TST,1,AAA,BBB,false,,landed,SECRET,Duplicate
2025-01-02,TST,2,AAA,BBB,false,CCC,landed,,
2025-01-03,TST,3,AAA,BBB,true,,,,
2026-10-13,TST,4,AAA,BBB,false,,,,
2026-10-14,TST,5,AAA,BBB,false,,,,
2026-12-01,TST,6,AAA,BBB,false,,,,
2025-01-04,TST,7,AAA,BBB,false,,scheduled,,
'''
        data, excluded = completed_routes(text, {'AAA': [0, 0], 'BBB': [20, 30], 'CCC': [40, 50]}, dt.date(2026, 10, 14))
        self.assertEqual(data['flightCount'], 2)
        self.assertEqual(excluded, 5)
        self.assertEqual(data['routes'][1]['to'], [40, 50])
        self.assertNotIn('SECRET', str(data))
        self.assertNotIn('2025', str(data))
        self.assertNotIn('Private', str(data))

    def test_unresolved_airport_does_not_silently_drop_history(self):
        with self.assertRaisesRegex(ValueError, 'BBB'):
            completed_routes('Date,From,To\n2025-01-01,AAA,BBB', {'AAA': [0, 0]}, dt.date(2026, 10, 14))

    def test_schema_must_match(self):
        with self.assertRaises(ValueError):
            completed_routes('date,origin,destination', {}, dt.date.today())


if __name__ == '__main__':
    unittest.main()
