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
        self._ylists = self._ydoc.get_map("lists")
        self._ytabs = self._ydoc.get_map("tabs")

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
        contents = self._ycontents.to_json()
        attributes = self._yattributes.to_json()
        dataset = self._ydataset.to_json()
        links = self._ylinks.to_json()
        lists = self._ylists.to_json()
        tabs = self._ytabs.to_json()
        return json.dumps(
            dict(
                contents=contents,
                attributes=attributes,
                dataset=dataset,
                links=links,
                lists=lists,
                tabs=tabs,
            )
        )

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

        data_collection_name: str = contents.get("__main__", {}).get("data", "")
        data_names: List[str] = []
        link_names: List[str] = []
        if data_collection_name:
            data_names = contents.get(data_collection_name, {}).get("data", [])
            link_names = contents.get(data_collection_name, {}).get("links", [])

        dataset: Dict[str, Dict] = {}
        attributes: Dict[str, Dict] = {}
        for data_name in data_names:
            dataset[data_name] = contents.get(data_name, {})
            for attribute in contents.get(data_name, {}).get("primary_owner", []):
                attributes[attribute] = contents.get(attribute, {})

        links: Dict[str, Dict] = {}
        lists: Dict[str, Dict] = {}
        for link_name in link_names:
            links[link_name] = contents.get(link_name, {})
            if links[link_name]["_type"] != COMPONENT_LINK_TYPE:
                for i in range(1, 3):
                    listName =links[link_name][f"cids{i}"]
                    lists[listName] = contents.get(listName, {})


        with self._ydoc.begin_transaction() as t:
            self._ycontents.update(t, contents.items())
            self._yattributes.update(t, attributes.items())
            self._ydataset.update(t, dataset.items())
            self._ylinks.update(t, links.items())
            self._ylists.update(t, lists.items())
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
        self._subscriptions[self._ylists] = self._ylists.observe(
            partial(callback, "lists")
        )
        self._subscriptions[self._ytabs] = self._ytabs.observe(
            partial(callback, "tabs")
        )
