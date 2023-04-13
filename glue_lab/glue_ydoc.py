import json
from typing import Dict, List

from jupyter_ydoc.ybasedoc import YBaseDoc


class YGlue(YBaseDoc):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ysource = self._ydoc.get_text("source")
        self._ycontents = self._ydoc.get_map("contents")
        self._ytabs = self._ydoc.get_map("tabs")

    def get(self) -> str:
        """
        Returns the content of the document.
        :return: Document's content.
        :rtype: Any
        """
        contents = self._ycontents.to_json()
        tabs = self._ytabs.to_json()
        return json.dumps(dict(contents=contents, tabs=tabs))

    def set(self, value: str) -> None:
        """
        Sets the content of the document.
        :param value: The content of the document.
        :type value: Any
        """
        contents = json.loads(value)

        tab_names: List[str] = contents.get("__main__", {}).get("tab_names", [])
        viewers = contents.get("__main__", {}).get("viewers", [])
        tabs: Dict[str, List] = {}
        for idx, tab in enumerate(tab_names):
            tabs[tab] = []
            for viewer in viewers[idx]:
                tabs[tab].append(contents.get(viewer, {}))

        with self._ydoc.begin_transaction() as t:
            self._ycontents.update(t, contents.items())
            self._ytabs.update(t, tabs.items())

    def observe(self, callback):
        self.unobserve()
        self._subscriptions[self._ystate] = self._ystate.observe(callback)
        self._subscriptions[self._ysource] = self._ysource.observe(callback)
        self._subscriptions[self._ycontents] = self._ycontents.observe_deep(callback)
        self._subscriptions[self._ytabs] = self._ytabs.observe_deep(callback)
