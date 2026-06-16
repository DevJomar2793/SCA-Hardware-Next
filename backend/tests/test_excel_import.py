import pandas as pd

from services.excel_import import safe_float, safe_int, safe_str


def test_safe_str_handles_empty_and_nan_values():
    assert safe_str(None) is None
    assert safe_str(float("nan")) is None
    assert safe_str("  Dell  ") == "Dell"
    assert safe_str("nat") is None


def test_safe_int_parses_numeric_values():
    assert safe_int("3") == 3
    assert safe_int(2.0) == 2
    assert safe_int("-") is None
    assert safe_int(pd.NA) is None


def test_safe_float_parses_currency_values():
    assert safe_float("₱1,234.50") == 1234.50
    assert safe_float("$50") == 50.0
    assert safe_float("") is None
    assert safe_float(pd.NA) is None
