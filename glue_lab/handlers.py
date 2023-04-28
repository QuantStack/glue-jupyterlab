import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from .glue_utils import get_advanced_links


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self, path):
        if path == "available-advanced-links":
            self.finish(json.dumps({"data": get_advanced_links()}))
        else:
            self.finish(
                json.dumps({"data": f"There is no endpoint at /glue-lab/{path}!"})
            )


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, r"glue-lab/([^/]+)")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
