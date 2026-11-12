{
    "name": "Zord | Identidade Brasileira",
    "summary": "Marca Zord, idioma pt_BR e moeda BRL",
    "version": "20.0.1.0.0",
    "category": "Hidden",
    "author": "Zord",
    "license": "LGPL-3",
    "depends": ["web", "l10n_br"],
    "data": ["views/branding.xml"],
    "assets": {
        "web.assets_backend": ["zord_brand/static/src/scss/zord.scss"],
        "web.assets_frontend": ["zord_brand/static/src/scss/zord.scss"]
    },
    "application": False,
    "installable": True,
    "auto_install": False,
    "post_init_hook": "post_init_hook"
}
