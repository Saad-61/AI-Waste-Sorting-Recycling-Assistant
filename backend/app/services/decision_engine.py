from typing import Dict, Any


class DecisionEngine:
    """Rule-based recyclability and disposal mapper"""

    RULES = {
        "plastic": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Rinse clean, empty all liquids, crush to save space, and replace cap."
        },
        "bottle": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Rinse thoroughly with water. Remove non-recyclable pumps or foil seals."
        },
        "can": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Empty liquid completely. Do not crush aluminum cans if optical sorting is required."
        },
        "cardboard": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Flatten boxes completely. Keep dry; do not recycle if heavily grease-stained."
        },
        "paper": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Ensure paper is dry and free of wax or plastic coatings. Shredded paper in paper bag."
        },
        "glass": {
            "bin": "Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": "Rinse clean. Discard broken glass safely or deposit in designated glass bank."
        },
        "organic": {
            "bin": "Organic",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": "Place in green organic waste bin or home compost. Avoid plastic packaging or stickers."
        },
        "food": {
            "bin": "Organic",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": "Scrape leftover food into compost / organic bin."
        },
        "battery": {
            "bin": "Hazardous",
            "recyclable": "Special Drop-off",
            "badge_variant": "danger",
            "instructions": "DO NOT place in curbside bins. Tape terminals and take to a certified e-waste drop-off."
        },
        "electronic": {
            "bin": "Hazardous",
            "recyclable": "Special Drop-off",
            "badge_variant": "danger",
            "instructions": "Bring to local municipal e-waste recycling collection facility."
        }
    }

    DEFAULT_RULE = {
        "bin": "General Waste",
        "recyclable": "No",
        "badge_variant": "secondary",
        "instructions": "Dispose in general landfill waste bin. Check municipal regulations for special programs."
    }

    def evaluate(self, label: str, material: str = "", confidence: float = 0.0) -> Dict[str, Any]:
        """
        Evaluates detection and classification outputs against waste management rules.
        """
        combined = f"{label} {material}".lower()

        for keyword, rule in self.RULES.items():
            if keyword in combined:
                return {
                    "disposal_bin": rule["bin"],
                    "recyclable": rule["recyclable"],
                    "badge_variant": rule["badge_variant"],
                    "instructions": rule["instructions"],
                    "confidence": confidence
                }

        return {
            "disposal_bin": self.DEFAULT_RULE["bin"],
            "recyclable": self.DEFAULT_RULE["recyclable"],
            "badge_variant": self.DEFAULT_RULE["badge_variant"],
            "instructions": self.DEFAULT_RULE["instructions"],
            "confidence": confidence
        }
