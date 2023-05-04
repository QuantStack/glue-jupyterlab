import json


async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("glue-lab", "get_example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"data": "There is no endpoint at /glue-lab/get_example!"}


async def test_get_advanced_links_list(jp_fetch):
    # When
    response = await jp_fetch("glue-lab", "advanced-links")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert list(payload["data"].keys()) == ["General", "Astronomy", "Join"]
