from pathlib import Path
import json

from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.template import loader
from django.views.decorators.http import require_GET


@require_GET
def openapi_json(request):
    spec_path = Path(settings.BASE_DIR) / "OpenAPISpec.json"
    with spec_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return JsonResponse(data)


@require_GET
def swagger_ui(request):
    template = loader.get_template("swagger_ui.html")
    return HttpResponse(template.render({"schema_url": "/swagger/openapi.json"}, request))
