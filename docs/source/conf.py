import os

on_rtd = os.environ.get("READTHEDOCS", None) == "True"

html_theme = "pydata_sphinx_theme"
html_theme_options = {"github_url": "https://github.com/QuantStack/glue-jupyterlab"}

extensions = [
    "sphinx.ext.intersphinx",
    "sphinx.ext.napoleon",
]

source_suffix = ".rst"
master_doc = "index"
project = "glue-jupyterlab"
copyright = "2023, The glue-jupyterlab Development Team"
author = "The glue-jupyterlab Development Team"
language = "en"

exclude_patterns = []
highlight_language = "python"
pygments_style = "sphinx"
todo_include_todos = False
htmlhelp_basename = "glue-jupyterlabdoc"
