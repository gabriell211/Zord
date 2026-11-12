#!/usr/bin/env python3
"""Customiza textos e rotas visíveis sem renomear dependências internas."""

from pathlib import Path

PATCHES = {
    Path("addons/web/views/webclient_templates.xml"): (
        ("<title t-out=\"title or 'Odoo'\"/>", "<title t-out=\"title or 'Zord'\"/>"),
        ('content="Odoo"', 'content="Zord"'),
        ('<a href="https://www.odoo.com?utm_source=db&amp;utm_medium=auth" target="_blank">Powered by <span>Odoo</span></a>',
         '<span>Zord · Gestão empresarial</span>'),
        ('href="/web/static/img/odoo-icon-ios.png"',
         'href="/zord_brand/static/src/img/zord-icon.svg"'),
        ('alt="Odoo logo"', 'alt="Zord"'),
        ("Odoo will load as soon as you're back online.",
         "O Zord estará disponível assim que a conexão voltar."),
    ),
    Path("addons/web/controllers/home.py"): (
        ("return request.redirect_query('/odoo', query=request.params)",
         "return request.redirect_query('/zord', query=request.params)"),
        ("@route(['/web', '/odoo', '/odoo/<path:subpath>', '/scoped_app/<path:subpath>']",
         "@route(['/web', '/zord', '/zord/<path:subpath>', '/odoo', '/odoo/<path:subpath>', '/scoped_app/<path:subpath>']"),
    ),
    Path("addons/web/static/src/webclient/navbar/navbar.xml"): (
        ('href="/odoo"', 'href="/zord"'),
    ),
}

for path, patches in PATCHES.items():
    before = path.read_text(encoding="utf-8")
    after = before
    for original, new in patches:
        if original not in after:
            raise SystemExit(f"Trecho esperado ausente em {path}: {original}")
        after = after.replace(original, new)
    if before != after:
        path.write_text(after, encoding="utf-8")
        print(f"Marca Zord aplicada: {path}")
