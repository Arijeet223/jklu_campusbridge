"""CampusBridge AI — Domain layer.

Pure-function modules for deterministic eligibility, alignment, and sandbox logic.
"""

from domain.eligibility import evaluate_single_rule, evaluate_eligibility
from domain.alignment import calculate_alignment
from domain.sandbox import simulate_counterfactual

__all__ = [
    "evaluate_single_rule",
    "evaluate_eligibility",
    "calculate_alignment",
    "simulate_counterfactual",
]
