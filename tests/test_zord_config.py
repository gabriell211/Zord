import ast
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TestZordBrasil(unittest.TestCase):
    def test_manifesto(self):
        manifest = ast.literal_eval(
            (ROOT / "custom_addons/zord_brand/__manifest__.py").read_text(encoding="utf-8")
        )
        self.assertEqual(manifest["license"], "LGPL-3")
        self.assertIn("l10n_br", manifest["depends"])

    def test_xml_valido(self):
        path = ROOT / "custom_addons/zord_brand/views/branding.xml"
        self.assertEqual(ET.parse(path).getroot().tag, "odoo")

    def test_padroes(self):
        script = (ROOT / "scripts/inicializar-brasil.sh").read_text(encoding="utf-8")
        self.assertIn("--load-language=pt_BR", script)
        self.assertIn("l10n_br,zord_brand", script)
        hooks = (ROOT / "custom_addons/zord_brand/hooks.py").read_text(encoding="utf-8")
        for item in ('"base.BRL"', '"base.br"', '"America/Sao_Paulo"'):
            self.assertIn(item, hooks)


if __name__ == "__main__":
    unittest.main()
