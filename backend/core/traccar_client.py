import requests
from django.conf import settings


class TraccarError(Exception):
    pass


def _base_url():
    return (settings.TRACCAR_BASE_URL or "").rstrip("/")


def _auth():
    return (settings.TRACCAR_USER or ""), (settings.TRACCAR_PASSWORD or "")


def _ensure_configured():
    if not settings.TRACCAR_BASE_URL:
        raise TraccarError("traccar_not_configured")
    token = (settings.TRACCAR_TOKEN or "").strip()
    if token:
        return
    user, pwd = _auth()
    if not user or not pwd:
        raise TraccarError("traccar_credentials_missing")


def _headers():
    token = (settings.TRACCAR_TOKEN or "").strip()
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}


def get_device_by_unique_id(unique_id, timeout=5):
    _ensure_configured()
    url = f"{_base_url()}/api/devices"
    response = requests.get(
        url,
        params={"uniqueId": unique_id},
        auth=_auth() if not settings.TRACCAR_TOKEN else None,
        headers=_headers(),
        timeout=timeout,
    )
    if response.status_code != 200:
        raise TraccarError(f"traccar_get_failed:{response.status_code}")
    data = response.json() or []
    if not data:
        return None
    return data[0]


def create_device(unique_id, name, timeout=5):
    _ensure_configured()
    url = f"{_base_url()}/api/devices"
    payload = {"uniqueId": unique_id, "name": name}
    response = requests.post(
        url,
        json=payload,
        auth=_auth() if not settings.TRACCAR_TOKEN else None,
        headers=_headers(),
        timeout=timeout,
    )
    if response.status_code in (200, 201):
        return response.json()
    if response.status_code == 409:
        existing = get_device_by_unique_id(unique_id, timeout=timeout)
        if existing:
            return existing
    detail = ""
    try:
        detail = response.text or ""
    except Exception:
        detail = ""
    detail = detail.strip().replace("\n", " ")
    if len(detail) > 200:
        detail = detail[:200] + "..."
    suffix = f":{detail}" if detail else ""
    raise TraccarError(f"traccar_create_failed:{response.status_code}{suffix}")


def update_device(unique_id, name=None, new_unique_id=None, timeout=5):
    _ensure_configured()
    existing = get_device_by_unique_id(unique_id, timeout=timeout)
    if not existing:
        raise TraccarError("traccar_device_not_found")
    device_id = existing.get("id")
    if not device_id:
        raise TraccarError("traccar_device_invalid")
    payload = {
        "id": device_id,
        "name": name or existing.get("name"),
        "uniqueId": new_unique_id or existing.get("uniqueId"),
    }
    url = f"{_base_url()}/api/devices/{device_id}"
    response = requests.put(
        url,
        json=payload,
        auth=_auth() if not settings.TRACCAR_TOKEN else None,
        headers=_headers(),
        timeout=timeout,
    )
    if response.status_code in (200, 201):
        return response.json()
    if response.status_code == 404:
        raise TraccarError("traccar_device_not_found")
    raise TraccarError(f"traccar_update_failed:{response.status_code}")


def delete_device(unique_id, timeout=5):
    _ensure_configured()
    existing = get_device_by_unique_id(unique_id, timeout=timeout)
    if not existing:
        return False
    device_id = existing.get("id")
    if not device_id:
        raise TraccarError("traccar_device_invalid")
    url = f"{_base_url()}/api/devices/{device_id}"
    response = requests.delete(
        url,
        auth=_auth() if not settings.TRACCAR_TOKEN else None,
        headers=_headers(),
        timeout=timeout,
    )
    if response.status_code in (200, 204):
        return True
    if response.status_code == 404:
        return False
    raise TraccarError(f"traccar_delete_failed:{response.status_code}")


def get_latest_position(unique_id, timeout=5):
    _ensure_configured()
    device = get_device_by_unique_id(unique_id, timeout=timeout)
    if not device:
        return None
    device_id = device.get("id")
    if not device_id:
        return None
    url = f"{_base_url()}/api/positions"
    response = requests.get(
        url,
        params={"deviceId": device_id, "limit": 1},
        auth=_auth() if not settings.TRACCAR_TOKEN else None,
        headers=_headers(),
        timeout=timeout,
    )
    if response.status_code != 200:
        raise TraccarError(f"traccar_positions_failed:{response.status_code}")
    data = response.json() or []
    if not data:
        return None
    position = data[0]
    return {
        "deviceId": device_id,
        "deviceName": device.get("name"),
        "positionId": position.get("id"),
        "latitude": position.get("latitude"),
        "longitude": position.get("longitude"),
        "fixTime": position.get("fixTime"),
    }
