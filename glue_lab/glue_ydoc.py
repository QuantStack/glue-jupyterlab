import json
from typing import Dict, List, Any, Callable
from functools import partial

from jupyter_ydoc.ybasedoc import YBaseDoc

import y_py as Y

COMPONENT_LINK_TYPE = "glue.core.component_link.ComponentLink"


class YGlue(YBaseDoc):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ysource = self._ydoc.get_text("source")
        self._ycontents = self._ydoc.get_map("contents")
        self._yattributes = self._ydoc.get_map("attributes")
        self._ydataset = self._ydoc.get_map("dataset")
        self._ylinks = self._ydoc.get_map("links")
        self._ytabs = self._ydoc.get_map("tabs")

        self._data_collection_name = ""

    @property
    def version(self) -> str:
        """
        Returns the version of the document.
        :return: Document's version.
        :rtype: str
        """
        return "1.0.0"

    def get(self) -> str:
        """
        Returns the content of the document.
        :return: Document's content.
        :rtype: Any
        """
        contents = json.loads(self._ycontents.to_json())
        json.loads(self._yattributes.to_json())
        dataset = json.loads(self._ydataset.to_json())
        links = json.loads(self._ylinks.to_json())
        tabs = json.loads(self._ytabs.to_json())

        contents.setdefault("__main__", {})

        tab_names = sorted(list(tabs.keys()))
        contents["__main__"]["tab_names"] = tab_names

        contents["__main__"].setdefault("viewers", [])

        while len(contents["__main__"]["viewers"]) != len(tab_names):
            contents["__main__"]["viewers"].append([])

        viewer_names = []
        for idx, tab in enumerate(tab_names):
            viewers = tabs[tab]
            viewer_names = sorted(list(viewers.keys()))

            contents["__main__"]["viewers"][idx] = viewer_names
            for viewer in viewer_names:
                contents[viewer] = viewers[viewer]

        if self._data_collection_name:
            data_names = sorted(list(dataset.keys()))
            link_names = sorted(list(links.keys()))

            contents[self._data_collection_name]["data"] = data_names
            contents[self._data_collection_name]["links"] = link_names

            for data_name in data_names:
                contents[data_name] = dataset[data_name]

            for link_name in link_names:
                contents[link_name] = links[link_name]

        return json.dumps(contents, sort_keys=True)

    def set(self, value: str) -> None:
        """
        Sets the content of the document.
        :param value: The content of the document.
        :type value: Any
        """
        contents = json.loads(value)

        tab_names: List[str] = contents.get("__main__", {}).get("tab_names", [])
        viewers = contents.get("__main__", {}).get("viewers", [])
        tabs: Dict[str, Y.YMap] = {}
        for idx, tab in enumerate(tab_names):
            items: Dict[str, Y.YMap] = {}
            for viewer in viewers[idx]:
                items[viewer] = contents.get(viewer, {})
            tabs[tab] = Y.YMap(items)

        self._data_collection_name: str = contents.get("__main__", {}).get("data", "")
        data_names: List[str] = []
        link_names: List[str] = []
        if self._data_collection_name:
            data_names = contents.get(self._data_collection_name, {}).get("data", [])
            link_names = contents.get(self._data_collection_name, {}).get("links", [])

        dataset: Dict[str, Dict] = {}
        attributes: Dict[str, Dict] = {}
        for data_name in data_names:
            dataset[data_name] = contents.get(data_name, {})
            for attribute in contents.get(data_name, {}).get("primary_owner", []):
                attributes[attribute] = contents.get(attribute, {})

        links: Dict[str, Dict] = {}
        for link_name in link_names:
            links[link_name] = contents.get(link_name, {})
            if links[link_name]["_type"] != COMPONENT_LINK_TYPE:
                for i in range(1, 3):
                    listName = links[link_name][f"cids{i}"]
                    links[link_name][f"cids{i}"] = contents.get(listName, {}).get(
                        "contents"
                    )

        with self._ydoc.begin_transaction() as t:
            self._ycontents.update(t, contents.items())
            self._yattributes.update(t, attributes.items())
            self._ydataset.update(t, dataset.items())
            self._ylinks.update(t, links.items())
            self._ytabs.update(t, tabs.items())

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
        self._subscriptions[self._yattributes] = self._ycontents.observe(
            partial(callback, "attributes")
        )
        self._subscriptions[self._ydataset] = self._ydataset.observe(
            partial(callback, "dataset")
        )
        self._subscriptions[self._ylinks] = self._ylinks.observe(
            partial(callback, "links")
        )
        self._subscriptions[self._ytabs] = self._ytabs.observe(
            partial(callback, "tabs")
        )
