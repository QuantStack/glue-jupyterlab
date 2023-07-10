import json
from copy import deepcopy
from typing import Dict, List, Any, Callable, Optional
from functools import partial
from jupyter_ydoc.ybasedoc import YBaseDoc
import y_py as Y

COMPONENT_LINK_TYPE = "glue.core.component_link.ComponentLink"
IDENTITY_LINK_FUNCTION = "glue.core.link_helpers.identity"


class YGlue(YBaseDoc):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._yprivate_messages = self._ydoc.get_map("private_messages")
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

    @property
    def contents(self) -> Dict:
        return json.loads(self._ycontents.to_json())

    @property
    def attributes(self) -> Dict:
        return json.loads(self._yattributes.to_json())

    @property
    def dataset(self) -> Dict:
        return json.loads(self._ydataset.to_json())

    @property
    def links(self) -> Dict:
        return json.loads(self._ylinks.to_json())

    @property
    def tabs(self) -> Dict:
        return json.loads(self._ytabs.to_json())

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

        contents["__main__"]["viewers"] = []
        for tab in tab_names:
            viewers = tabs.get(tab, {})
            viewer_names = sorted(list(viewers.keys()))

            contents["__main__"]["viewers"].append(viewer_names)
            for viewer in viewer_names:
                contents[viewer] = viewers[viewer]

        if self._data_collection_name:
            data_names = sorted(list(dataset.keys()))
            link_names = sorted(list(links.keys()))

            contents[self._data_collection_name]["data"] = data_names
            contents[self._data_collection_name]["links"] = link_names

            for data_name in data_names:
                contents[data_name] = dataset[data_name]

            self.add_links_to_contents(links, contents)
        return json.dumps(contents, indent=2, sort_keys=True)

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

        links = self.extract_links_from_file(link_names, contents, dataset, attributes)

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
        self._subscriptions[self._ytabs] = self._ytabs.observe_deep(
            partial(callback, "tabs")
        )
        self._subscriptions[
            self._yprivate_messages
        ] = self._yprivate_messages.observe_deep(partial(callback, "private_messages"))

    def get_tab_names(self) -> List[str]:
        return list(self._ytabs.keys())

    def get_tab_data(self, tab_name: str) -> Optional[Dict]:
        tab = self._ytabs.get(tab_name)
        if tab is not None:
            return json.loads(tab.to_json())

    def remove_tab_viewer(self, tab_name: str, viewer_id: str) -> None:
        tab = self._ytabs.get(tab_name)
        if tab is not None:
            with self._ydoc.begin_transaction() as t:
                tab.pop(t, viewer_id)

    def extract_links_from_file(
        self,
        link_names: List[str],
        contents: Dict,
        dataset: Dict[str, Dict],
        attributes: Dict[str, Dict],
    ) -> Dict[str, Dict]:
        links: Dict[str, Dict] = {}
        for link_name in link_names:
            link: Dict = deepcopy(contents.get(link_name, {}))
            uniform_link = {"_type": link.pop("_type")}
            if uniform_link["_type"] == COMPONENT_LINK_TYPE:
                uniform_link["data1"] = next(
                    (
                        k
                        for k, v in dataset.items()
                        if link["frm"][0] in v["primary_owner"]
                    ),
                    None,
                )
                uniform_link["data2"] = next(
                    (
                        k
                        for k, v in dataset.items()
                        if link["to"][0] in v["primary_owner"]
                    ),
                    None,
                )
                uniform_link["cids1"] = link.pop("frm")
                uniform_link["cids2"] = link.pop("to")
                for i in [1, 2]:
                    uniform_link[f"cids{i}_labels"] = [
                        attributes[attribute]["label"]
                        for attribute in uniform_link[f"cids{i}"]
                    ]
            else:
                for i in [1, 2]:
                    listName = link.pop(f"cids{i}")
                    uniform_link[f"cids{i}"] = contents.get(listName, {}).get(
                        "contents"
                    )
                    uniform_link[f"cids{i}_labels"] = [
                        attributes[attribute]["label"]
                        for attribute in uniform_link[f"cids{i}"]
                    ]

            uniform_link.update(link)
            links[link_name] = uniform_link
        return links

    def add_links_to_contents(self, links: Dict[str, Dict], contents: Dict):
        # Delete former links and attributes lists.
        for link_names in contents.get(self._data_collection_name, {}).get("links", []):
            link = contents.pop(link_names, {})

            # Delete the list objects containing the attributes of advanced links.
            if link.get("_type", "") != COMPONENT_LINK_TYPE:
                contents.pop(link.get("cids1", None), None)
                contents.pop(link.get("cids2", None), None)
        contents[self._data_collection_name]["links"] = []

        # Create the new links and attribute lists if necessary.
        lists_count = -1
        for link_name, link in links.items():
            if link["_type"] == COMPONENT_LINK_TYPE:
                link["frm"] = link.pop("cids1", [])
                link["to"] = link.pop("cids2", [])
                for i in [1, 2]:
                    link.pop(f"cids{i}_labels", None)
                    link.pop(f"data{i}", None)
            else:
                for i in [1, 2]:
                    list_name = f"list{'' if lists_count < 0 else f'_{lists_count}'}"
                    lists_count += 1
                    link.pop(f"cids{i}_labels", None)
                    attr_list = {
                        "_type": "builtins.list",
                        "contents": link.pop(f"cids{i}", []),
                    }
                    contents[list_name] = attr_list
                    link[f"cids{i}"] = list_name
            contents[link_name] = link
            contents[self._data_collection_name]["links"].append(link_name)
        contents[self._data_collection_name]["links"].sort()
