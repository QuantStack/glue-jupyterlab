import json
from typing import Dict, List, Any, Callable
from functools import partial

from jupyter_ydoc.ybasedoc import YBaseDoc


class YGlue(YBaseDoc):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ysource = self._ydoc.get_text("source")
        self._ycontents = self._ydoc.get_map("contents")
        self._ytabs = self._ydoc.get_map("tabs")
        self._ydataset = self._ydoc.get_map("dataset")
        self._ylinks = self._ydoc.get_map("links")

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

        data_collection_name: str = contents.get("__main__", {}).get("data", "")
        data_names: List[str] = []
        link_names: List[str] = []
        if data_collection_name:
            data_names = contents.get(data_collection_name, {}).get("data", [])
            link_names = contents.get(data_collection_name, {}).get("links", [])

        dataset: Dict[str, Dict] = {}
        for data_name in data_names:
            dataset[data_name] = contents.get(data_name, {})
        links: Dict[str, Dict] = {}
        for link_name in link_names:
            links[link_name] = contents.get(link_name, {})

        with self._ydoc.begin_transaction() as t:
            self._ycontents.update(t, contents.items())
            self._ytabs.update(t, tabs.items())
            self._ydataset.update(t, dataset.items())
            self._ylinks.update(t, links.items())

    def observe(self, callback: Callable[[str, Any], None]):
        self.unobserve()
        self._subscriptions[self._ystate] = self._ystate.observe(
            partial(callback, "state")
        )
        self._subscriptions[self._ysource] = self._ysource.observe(
            partial(callback, "source")
        )
        self._subscriptions[self._ycontents] = self._ycontents.observe(
            partial(callback, "contents")
        )
        self._subscriptions[self._ytabs] = self._ytabs.observe(
            partial(callback, "tabs")
        )
