from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from core.traccar_client import (
    TraccarError, _base_url, _auth, _ensure_configured, _headers,
    get_device_by_unique_id, create_device, update_device, delete_device,
    get_latest_position,
)


TRACCAR_SETTINGS = {
    'TRACCAR_BASE_URL': 'http://traccar:8082',
    'TRACCAR_USER': 'admin',
    'TRACCAR_PASSWORD': 'admin',
    'TRACCAR_TOKEN': '',
}

TRACCAR_TOKEN_SETTINGS = {
    'TRACCAR_BASE_URL': 'http://traccar:8082',
    'TRACCAR_USER': '',
    'TRACCAR_PASSWORD': '',
    'TRACCAR_TOKEN': 'my-token',
}


@override_settings(**TRACCAR_SETTINGS)
class TraccarHelperTest(TestCase):
    def test_base_url(self):
        self.assertEqual(_base_url(), 'http://traccar:8082')

    def test_auth(self):
        self.assertEqual(_auth(), ('admin', 'admin'))

    def test_ensure_configured_ok(self):
        _ensure_configured()

    @override_settings(TRACCAR_BASE_URL='')
    def test_ensure_configured_no_url(self):
        with self.assertRaises(TraccarError):
            _ensure_configured()

    @override_settings(TRACCAR_USER='', TRACCAR_PASSWORD='', TRACCAR_TOKEN='')
    def test_ensure_configured_no_creds(self):
        with self.assertRaises(TraccarError):
            _ensure_configured()

    def test_headers_no_token(self):
        self.assertEqual(_headers(), {})

    @override_settings(**TRACCAR_TOKEN_SETTINGS)
    def test_headers_with_token(self):
        self.assertIn('Authorization', _headers())

    @override_settings(**TRACCAR_TOKEN_SETTINGS)
    def test_ensure_configured_with_token(self):
        _ensure_configured()


@override_settings(**TRACCAR_SETTINGS)
class GetDeviceTest(TestCase):
    @patch('core.traccar_client.requests.get')
    def test_get_device_found(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200, json=lambda: [{'id': 1, 'uniqueId': 'GPS001'}])
        result = get_device_by_unique_id('GPS001')
        self.assertEqual(result['id'], 1)

    @patch('core.traccar_client.requests.get')
    def test_get_device_not_found(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200, json=lambda: [])
        result = get_device_by_unique_id('UNKNOWN')
        self.assertIsNone(result)

    @patch('core.traccar_client.requests.get')
    def test_get_device_error(self, mock_get):
        mock_get.return_value = MagicMock(status_code=500)
        with self.assertRaises(TraccarError):
            get_device_by_unique_id('GPS001')


@override_settings(**TRACCAR_SETTINGS)
class CreateDeviceTest(TestCase):
    @patch('core.traccar_client.requests.post')
    def test_create_success(self, mock_post):
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {'id': 1, 'uniqueId': 'GPS001'})
        result = create_device('GPS001', 'Mon GPS')
        self.assertEqual(result['id'], 1)

    @patch('core.traccar_client.get_device_by_unique_id')
    @patch('core.traccar_client.requests.post')
    def test_create_conflict_existing(self, mock_post, mock_get):
        mock_post.return_value = MagicMock(status_code=409)
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001'}
        result = create_device('GPS001', 'Mon GPS')
        self.assertEqual(result['id'], 1)

    @patch('core.traccar_client.requests.post')
    def test_create_error(self, mock_post):
        mock_post.return_value = MagicMock(status_code=500, text='Internal Server Error')
        with self.assertRaises(TraccarError):
            create_device('GPS001', 'Mon GPS')

    @patch('core.traccar_client.requests.post')
    def test_create_error_long_detail(self, mock_post):
        mock_post.return_value = MagicMock(status_code=400, text='x' * 300)
        with self.assertRaises(TraccarError):
            create_device('GPS001', 'Mon GPS')


@override_settings(**TRACCAR_SETTINGS)
class UpdateDeviceTest(TestCase):
    @patch('core.traccar_client.requests.put')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_update_success(self, mock_get, mock_put):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Old'}
        mock_put.return_value = MagicMock(status_code=200, json=lambda: {'id': 1, 'name': 'New'})
        result = update_device('GPS001', name='New')
        self.assertEqual(result['name'], 'New')

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_update_not_found(self, mock_get):
        mock_get.return_value = None
        with self.assertRaises(TraccarError):
            update_device('UNKNOWN')

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_update_invalid_device(self, mock_get):
        mock_get.return_value = {'uniqueId': 'GPS001'}
        with self.assertRaises(TraccarError):
            update_device('GPS001')

    @patch('core.traccar_client.requests.put')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_update_404(self, mock_get, mock_put):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Old'}
        mock_put.return_value = MagicMock(status_code=404)
        with self.assertRaises(TraccarError):
            update_device('GPS001')

    @patch('core.traccar_client.requests.put')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_update_server_error(self, mock_get, mock_put):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Old'}
        mock_put.return_value = MagicMock(status_code=500)
        with self.assertRaises(TraccarError):
            update_device('GPS001')


@override_settings(**TRACCAR_SETTINGS)
class DeleteDeviceTest(TestCase):
    @patch('core.traccar_client.requests.delete')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_delete_success(self, mock_get, mock_del):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001'}
        mock_del.return_value = MagicMock(status_code=204)
        self.assertTrue(delete_device('GPS001'))

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_delete_not_found(self, mock_get):
        mock_get.return_value = None
        with self.assertRaises(TraccarError):
            delete_device('UNKNOWN')

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_delete_invalid_device(self, mock_get):
        mock_get.return_value = {'uniqueId': 'GPS001'}
        with self.assertRaises(TraccarError):
            delete_device('GPS001')

    @patch('core.traccar_client.requests.delete')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_delete_404(self, mock_get, mock_del):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001'}
        mock_del.return_value = MagicMock(status_code=404)
        with self.assertRaises(TraccarError):
            delete_device('GPS001')

    @patch('core.traccar_client.requests.delete')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_delete_server_error(self, mock_get, mock_del):
        mock_get.return_value = {'id': 1, 'uniqueId': 'GPS001'}
        mock_del.return_value = MagicMock(status_code=500)
        with self.assertRaises(TraccarError):
            delete_device('GPS001')


@override_settings(**TRACCAR_SETTINGS)
class GetLatestPositionTest(TestCase):
    @patch('core.traccar_client.requests.get')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_position_success(self, mock_get_device, mock_get):
        mock_get_device.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Mon GPS'}
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: [{'id': 10, 'latitude': 43.6, 'longitude': 3.8, 'fixTime': '2025-01-01T00:00:00Z'}]
        )
        result = get_latest_position('GPS001')
        self.assertEqual(result['latitude'], 43.6)
        self.assertEqual(result['deviceId'], 1)

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_position_no_device(self, mock_get_device):
        mock_get_device.return_value = None
        result = get_latest_position('UNKNOWN')
        self.assertIsNone(result)

    @patch('core.traccar_client.get_device_by_unique_id')
    def test_position_no_device_id(self, mock_get_device):
        mock_get_device.return_value = {'uniqueId': 'GPS001'}
        result = get_latest_position('GPS001')
        self.assertIsNone(result)

    @patch('core.traccar_client.requests.get')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_position_empty(self, mock_get_device, mock_get):
        mock_get_device.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Mon GPS'}
        mock_get.return_value = MagicMock(status_code=200, json=lambda: [])
        result = get_latest_position('GPS001')
        self.assertIsNone(result)

    @patch('core.traccar_client.requests.get')
    @patch('core.traccar_client.get_device_by_unique_id')
    def test_position_error(self, mock_get_device, mock_get):
        mock_get_device.return_value = {'id': 1, 'uniqueId': 'GPS001', 'name': 'Mon GPS'}
        mock_get.return_value = MagicMock(status_code=500)
        with self.assertRaises(TraccarError):
            get_latest_position('GPS001')
