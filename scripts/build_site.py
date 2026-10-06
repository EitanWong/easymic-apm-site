#!/usr/bin/env python3
"""Build the public product site and Markdown guides as portable static files."""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

import markdown

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site"


def product_values() -> dict[str, str]:
    product = json.loads((SOURCE / "product.json").read_text())
    return {
        **{key: str(value) for key, value in product.items() if not isinstance(value, dict)},
        "devicePrice": str(product["plans"]["device"]["price"]),
        "professionalPrice": str(product["plans"]["professional"]["price"]),
    }


def substitute(text: str, values: dict[str, str], *, escape: bool = False) -> str:
    def replace(match: re.Match) -> str:
        key = match.group(1)
        if key not in values:
            raise ValueError(f"Unknown product placeholder: {key}")
        return html.escape(values[key], quote=True) if escape else values[key]
    return re.sub(r"\{\{(\w+)\}\}", replace, text)


def render_shell(template: str, **values: str) -> str:
    for key, value in values.items():
        template = template.replace(f"@@{key}@@", value)
    if re.search(r"@@\w+@@", template):
        raise ValueError("Unresolved document template placeholder")
    return template


def nav_html(entries: list[dict], active: str) -> str:
    result, previous_group = [], None
    for entry in entries:
        if entry["group"] != previous_group:
            result.append(f'<p class="doc-group">{html.escape(entry["group"])}</p>')
            previous_group = entry["group"]
        current = ' aria-current="page"' if entry["slug"] == active else ""
        result.append(f'<a href="../{entry["slug"]}/"{current}>{html.escape(entry["title"])}</a>')
    return "".join(result)


def markdown_document(entry: dict, entries: list[dict], values: dict) -> tuple[str, str, str]:
    source = substitute((ROOT / entry["source"]).read_text(), values)
    # Product guides use Markdown links; emitted pages use actual static routes.
    for linked in entries:
        filename = Path(linked["source"]).name
        source = re.sub(r"\]\(" + re.escape(filename) + r"(#[^)]+)?\)",
                        lambda m, slug=linked["slug"]: f"](../{slug}/{m.group(1) or ''})", source)
    renderer = markdown.Markdown(extensions=["fenced_code", "tables", "toc", "sane_lists"],
                                 extension_configs={"toc": {"toc_depth": "2-3"}})
    body = renderer.convert(source)
    body = re.sub(r"(<table>.*?</table>)", r'<div class="table-scroll">\1</div>', body, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", body))
    text = re.sub(r"\s+", " ", text).strip()
    return body, renderer.toc, text


class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                raise ValueError(f"Duplicate HTML id: {attrs['id']}")
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs:
                self.links.append(attrs[key])


def validate(output: Path) -> int:
    parsers = {}
    for path in output.rglob("*.html"):
        parser = LinkCollector()
        parser.feed(path.read_text())
        parsers[path.resolve()] = parser
    total = 0
    for path, parser in parsers.items():
        if path.name == "404.html":
            continue  # Its base URL deliberately points at the hosted project root.
        for link in parser.links:
            parsed = urlparse(link)
            if parsed.scheme or parsed.netloc or link.startswith("/"):
                continue
            target = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                raise ValueError(f"Missing local link in {path.relative_to(output)}: {link}")
            if parsed.fragment and target.suffix == ".html":
                if unquote(parsed.fragment) not in parsers[target].ids:
                    raise ValueError(f"Missing fragment in {path.relative_to(output)}: {link}")
            total += 1
    return total


def build(output: Path, base_url: str) -> None:
    output = output.resolve()
    # Prevent a custom output argument from clearing source directories.
    if output in (ROOT, SOURCE) or output in ROOT.parents or SOURCE.is_relative_to(output):
        raise ValueError("Output must be a dedicated generated directory")
    output.mkdir(parents=True, exist_ok=True)
    # Only replace files owned by the generator; never remove an arbitrary directory.
    for directory in ("assets", "docs"):
        if (output / directory).exists():
            shutil.rmtree(output / directory)
    shutil.copytree(SOURCE / "assets", output / "assets")
    values = product_values()
    for filename in ("index.html", "cover.html"):
        (output / filename).write_text(substitute((SOURCE / filename).read_text(), values, escape=True))
    (output / ".nojekyll").write_text("")
    entries = json.loads((SOURCE / "docs.json").read_text())
    template = substitute((SOURCE / "templates/docs.html").read_text(), values, escape=True)
    doc_data = []
    for index, entry in enumerate(entries):
        body, toc, search_text = markdown_document(entry, entries, values)
        previous_next = []
        for direction, offset in (("上一篇", -1), ("下一篇", 1)):
            i = index + offset
            if 0 <= i < len(entries):
                other = entries[i]
                previous_next.append(f'<a href="../{other["slug"]}/"><small>{direction}</small>{html.escape(other["title"])}</a>')
            else:
                previous_next.append('<span></span>')
        content = f'''<div class="docs-layout">
<aside class="docs-sidebar"><span class="small-label">EASYMIC APM · GUIDES</span><button class="docs-toggle" aria-expanded="false" aria-controls="docs-navigation">浏览文档 <span aria-hidden="true">⌄</span></button><nav id="docs-navigation" aria-label="文档目录">{nav_html(entries, entry['slug'])}</nav><a href="../../" class="sidebar-home">← 返回产品介绍</a></aside>
<main id="main"><header class="doc-header"><div class="doc-breadcrumb"><a href="../">文档中心</a><span>/</span><span>{html.escape(entry['group'])}</span></div><h1>{html.escape(entry['title'])}</h1><p>{html.escape(entry['description'])}</p></header><article class="article-body">{body}</article><nav class="doc-previous-next" aria-label="相邻文档">{''.join(previous_next)}</nav><p class="docs-bottom">产品版本与授权信息随产品更新维护。购买及项目咨询：微信 {html.escape(values['wechat'])}。</p></main>
<aside class="docs-toc"><span>本页内容</span><nav aria-label="本页目录">{toc}</nav></aside></div>'''
        destination = output / "docs" / entry["slug"]
        destination.mkdir(parents=True)
        (destination / "index.html").write_text(render_shell(template, title=html.escape(entry["title"]), description=html.escape(entry["description"]), root="../../", content=content))
        doc_data.append((entry, search_text))
    cards = []
    for entry, search_text in doc_data:
        cards.append(f'<a class="docs-card" href="{entry["slug"]}/" data-search="{html.escape(search_text.lower(), quote=True)}"><small>{html.escape(entry["group"])}</small><h2>{html.escape(entry["title"])}</h2><p>{html.escape(entry["description"])}</p><span aria-hidden="true">↗</span></a>')
    content = f'''<main id="main" class="docs-home"><div class="docs-home-header"><div><p class="eyebrow">EASYMIC APM · DOCUMENTATION</p><h1>好声音。<br>从这里接入。</h1></div><p>认识产品，选择授权，完成集成。<br>面向整个 APM 库与 Unity 工作流的使用指南。</p></div><label class="docs-search" for="docs-search"><span aria-hidden="true">⌕</span><input id="docs-search" type="search" aria-label="搜索文档内容" placeholder="搜索文档：授权、AEC、Unity、麦克风…" autocomplete="off"></label><noscript><p class="noscript-note">所有指南都可以直接阅读。启用 JavaScript 后可搜索文档内容。</p></noscript><div class="docs-grid">{''.join(cards)}</div><p class="search-status" id="search-status" role="status" aria-live="polite"></p><p class="docs-version">原生 SDK {values['nativeVersion']} · Unity Package {values['unityVersion']} · Unity {values['unityMinimum']}+</p></main>'''
    (output / "docs/index.html").write_text(render_shell(template, title="文档中心", description="EasyMic APM 原生库与 Unity 集成、授权、设备配置指南。", root="../", content=content))
    base_path = urlparse(base_url).path.rstrip("/") + "/" if base_url else "/"
    (output / "404.html").write_text(f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="{html.escape(base_path, quote=True)}"><title>页面未找到 · EasyMic APM</title><link rel="stylesheet" href="assets/css/site.css"></head><body><main class="site-404"><div><h1>404</h1><h2>这个页面，暂时不在这里。</h2><p>回到产品首页，或在文档中心查找需要的指南。</p><a class="button button-blue" href="./">产品首页 ↗</a><a class="button button-text" href="docs/">文档中心</a></div></main></body></html>''')
    count = validate(output)
    print(f"Built {len(entries)} guides; validated {count} internal links. Output: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    parser.add_argument("--base-url", default="")
    args = parser.parse_args()
    build(args.output, args.base_url)
