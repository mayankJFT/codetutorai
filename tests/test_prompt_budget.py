from nodes import build_files_context


def files(n, size=20000):
    return [(f"src/file_{i}.py", "x" * size) for i in range(n)]


def test_small_repo_fits_untruncated():
    ctx, info = build_files_context(files(3, 1000), total_chars=24000)
    assert ctx.count("--- File Index") == 3
    assert "truncated" not in ctx
    assert info == [(0, "src/file_0.py"), (1, "src/file_1.py"), (2, "src/file_2.py")]


def test_large_repo_total_is_bounded():
    ctx, info = build_files_context(files(50), total_chars=24000)
    assert len(ctx) <= 24000 + 50 * 200  # headers/markers overhead only
    assert len(info) == 50               # every file still listed


def test_each_file_keeps_a_minimum_slice():
    ctx, _ = build_files_context(files(100), total_chars=24000)
    # every file appears with at least some content or a truncation marker
    assert ctx.count("--- File Index") == 100


def test_single_huge_file_is_cut_to_budget():
    ctx, _ = build_files_context(files(1, 500000), total_chars=24000)
    assert len(ctx) < 30000
    assert "truncated" in ctx
