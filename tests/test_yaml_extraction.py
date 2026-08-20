import pytest

from nodes import extract_yaml_block, safe_path_component


def test_extracts_fenced_yaml():
    assert extract_yaml_block("text\n```yaml\na: 1\n```\nmore") == "a: 1"


def test_extracts_plain_fence():
    assert extract_yaml_block("```\nb: 2\n```") == "b: 2"


def test_bare_yaml_passthrough():
    assert extract_yaml_block("c: 3\n") == "c: 3"


def test_empty_response_raises():
    with pytest.raises(ValueError):
        extract_yaml_block("   ")


def test_safe_path_component_strips_traversal():
    assert "/" not in safe_path_component("../../etc")
    assert safe_path_component("../../etc") != ""
    assert safe_path_component("My Project!") == "My_Project"
    assert safe_path_component("...") == "project"
    assert safe_path_component("/absolute/path") == "absolute_path"
