from typing import List, Dict
from glue.main import load_plugins
from glue.config import link_function, link_helper

load_plugins()


def get_function_name(info):
    item = info[0]
    if hasattr(item, 'display') and item.display is not None:
        return item.display
    else:
        return item.__name__


def get_advanced_links():

    advanced_links: Dict[str, List] = {}

    for function in link_function.members:
        if len(function.output_labels) == 1:
            if not function.category in advanced_links:
                advanced_links[function.category]: List[str] = []
            advanced_links[function.category].append(get_function_name(function))

    for helper in link_helper.members:
        if not helper.category in advanced_links:
            advanced_links[helper.category]: List[str] = []
        advanced_links[helper.category].append(get_function_name(helper))

    # Reordering the dict
    categories = ['General'] + sorted(set(advanced_links.keys()) - set(['General']))
    advanced_links = {k: sorted(advanced_links[k]) for k in categories}
    return advanced_links
