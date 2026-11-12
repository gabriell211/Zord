"""Configuracao inicial para NOVOS bancos Zord. Requer --load-language=pt_BR."""

def post_init_hook(env):
    languages = env["res.lang"].sudo().with_context(active_test=False)
    language = languages.search([("code", "=", "pt_BR")], limit=1)
    if not language:
        raise ValueError("O Zord deve ser instalado com --load-language=pt_BR")
    if not language.active:
        language.action_unarchive()

    brazil = env.ref("base.br")
    real = env.ref("base.BRL")
    if not real.active:
        real.sudo().write({"active": True})

    company = env.ref("base.main_company")
    company.sudo().write({"country_id": brazil.id, "currency_id": real.id})
    if company.partner_id:
        company.partner_id.sudo().write({"lang": "pt_BR"})

    admin = env.ref("base.user_admin", raise_if_not_found=False)
    if admin:
        admin.sudo().write({"lang": "pt_BR", "tz": "America/Sao_Paulo"})

    env["ir.default"].sudo().set("res.partner", "lang", "pt_BR")
