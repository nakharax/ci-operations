"""Unit tests for the Vercel serverless API handler."""
import json
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

from api.index import handler


class VercelApiTests(unittest.TestCase):
    def setUp(self):
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)

    def test_state_endpoint_returns_json(self):
        with urllib.request.urlopen(f'{self.origin}/api/state', timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertIn('application/json', response.headers.get('Content-Type'))
            data = json.loads(response.read().decode('utf-8'))
            self.assertIn('runners', data)
            self.assertIn('jobs', data)

    def test_history_endpoint_returns_json_summary(self):
        with urllib.request.urlopen(f'{self.origin}/api/history?window=24h', timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertIn('application/json', response.headers.get('Content-Type'))
            data = json.loads(response.read().decode('utf-8'))
            self.assertIn('summary', data)
            self.assertIn('jobs', data)

    def test_history_csv_endpoint_returns_csv(self):
        with urllib.request.urlopen(f'{self.origin}/api/history.csv?window=24h', timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertIn('text/csv', response.headers.get('Content-Type'))

    def test_unknown_api_route_is_404(self):
        import urllib.error
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(f'{self.origin}/api/nonexistent', timeout=5)
        self.assertEqual(ctx.exception.code, 404)


if __name__ == '__main__':
    unittest.main()

