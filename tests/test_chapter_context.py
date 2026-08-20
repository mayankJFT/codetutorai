from nodes import build_previous_chapters_context


def test_empty_returns_empty_string():
    assert build_previous_chapters_context([], max_chars=1000) == ""


def test_short_chapters_are_kept_verbatim():
    chapters = ["# Chapter 1: Node\n\nbody one", "# Chapter 2: Flow\n\nbody two"]
    out = build_previous_chapters_context(chapters, max_chars=10_000)
    assert "# Chapter 1: Node" in out and "body one" in out
    assert "# Chapter 2: Flow" in out and "body two" in out


def test_total_length_is_bounded():
    chapters = [f"# Chapter {i}\n\n" + ("x" * 5000) for i in range(5)]
    out = build_previous_chapters_context(chapters, max_chars=4000)
    assert len(out) <= 4000


def test_every_chapter_heading_survives_truncation():
    chapters = [f"# Chapter {i}: Topic{i}\n\n" + ("y" * 5000) for i in range(4)]
    out = build_previous_chapters_context(chapters, max_chars=3000)
    for i in range(4):
        assert f"# Chapter {i}: Topic{i}" in out


def test_truncated_chapters_are_marked():
    chapters = ["# Chapter 1\n\n" + ("z" * 5000)]
    out = build_previous_chapters_context(chapters, max_chars=500)
    assert "[... truncated ...]" in out
