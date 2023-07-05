import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from .glue_utils import get_advanced_links

"""The handler to get the advanced links."""


class AdvancedLinkHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({"data": get_advanced_links()}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "glue-jupyterlab", "advanced-links")
    handlers = [(route_pattern, AdvancedLinkHandler)]
    web_app.add_handlers(host_pattern, handlers)
