from typing import Dict, Any


class DecisionEngine:
    """Rule-based recyclability and disposal mapper with material-specific instructions"""

    # Order matters — more specific keys first to win matching priority
    RULES = {
        # ── Foliage / organic backgrounds ─────────────────────────────────────
        "foliage": {
            "bin": "Organic / Yard Waste",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": (
                "Natural plant foliage or organic matter detected. "
                "Place in your green yard-waste or compost bin."
            ),
        },
        "plant": {
            "bin": "Organic / Yard Waste",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": (
                "Garden or natural plant material. "
                "Dispose in the green compost / yard-waste bin."
            ),
        },
        "leaf": {
            "bin": "Organic / Yard Waste",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": (
                "Autumn leaves or garden cuttings. "
                "Place in the green yard-waste or compost bin — do NOT bag in plastic."
            ),
        },

        # ── Glass ─────────────────────────────────────────────────────────────
        "glass": {
            "bin": "Glass / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Rinse the bottle or jar clean. "
                "Do NOT break — deposit whole in the glass recyclable bin. "
                "Remove metal lids separately (place in metal bin)."
            ),
        },

        # ── Cardboard ─────────────────────────────────────────────────────────
        "cardboard": {
            "bin": "Paper & Card / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Flatten the box completely before placing in the recyclables bin. "
                "Keep dry — heavily grease-stained card (e.g. pizza boxes) belongs in general waste."
            ),
        },

        # ── Paper ─────────────────────────────────────────────────────────────
        "paper": {
            "bin": "Paper & Card / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Ensure paper is dry and free of wax or plastic coatings. "
                "Shredded paper should go in a sealed paper bag before recycling."
            ),
        },

        # ── Metal / Cans ──────────────────────────────────────────────────────
        "metal can": {
            "bin": "Metal / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Empty all liquid. Rinse lightly. "
                "Aluminium and tin cans are 100 % recyclable — no need to crush them."
            ),
        },
        "can": {
            "bin": "Metal / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Empty all liquid. Rinse lightly. "
                "Aluminium and tin cans are 100 % recyclable — no need to crush them."
            ),
        },
        "metal": {
            "bin": "Metal / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Separate ferrous (iron/steel) from non-ferrous (aluminium) where possible. "
                "Clean and dry before placing in the metal recyclables bin."
            ),
        },
        "aluminum": {
            "bin": "Metal / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Empty and lightly rinse. Aluminium is infinitely recyclable — "
                "place in the metal or mixed recyclables bin."
            ),
        },
        "tin": {
            "bin": "Metal / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Empty all liquid. Rinse lightly. "
                "Tin cans are fully recyclable — place in the metal recyclables bin."
            ),
        },

        # ── Plastic – rigid (bottles, containers) ─────────────────────────────
        "plastic bottle": {
            "bin": "Plastics / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Empty all liquid. Rinse clean. Replace the cap. "
                "Crush lightly to save space. Place in the plastics recyclable bin (PET / HDPE accepted)."
            ),
        },
        "plastic container": {
            "bin": "Plastics / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Remove all food residue and rinse. Replace the lid. "
                "Place in the rigid plastics recyclable bin."
            ),
        },
        "hdpe": {
            "bin": "Plastics / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "HDPE (#2) containers are widely recycled. "
                "Rinse, replace the cap, and place in the plastics bin."
            ),
        },
        "pet": {
            "bin": "Plastics / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "PET (#1) bottles are widely recycled. "
                "Rinse, replace cap, and lightly crush before placing in the plastics bin."
            ),
        },

        # ── Plastic – soft / film (bags, wrap) ────────────────────────────────
        "plastic bag": {
            "bin": "Soft Plastics — Store Drop-off",
            "recyclable": "Special Collection",
            "badge_variant": "warning",
            "instructions": (
                "Soft plastic bags and film CANNOT go in kerbside recycling bins — "
                "they jam sorting machinery. "
                "Do NOT rinse (water contaminates bales). "
                "Take clean, dry bags to a supermarket soft-plastics drop-off point."
            ),
        },
        "bag": {
            "bin": "Soft Plastics — Store Drop-off",
            "recyclable": "Special Collection",
            "badge_variant": "warning",
            "instructions": (
                "Soft plastic bags and film CANNOT go in kerbside recycling bins. "
                "Do NOT attempt to rinse. "
                "Take clean, dry bags to a supermarket or council soft-plastics drop-off point."
            ),
        },
        "film": {
            "bin": "Soft Plastics — Store Drop-off",
            "recyclable": "Special Collection",
            "badge_variant": "warning",
            "instructions": (
                "Plastic film/wrap cannot be processed at kerbside. "
                "Keep dry and clean, then drop off at a designated soft-plastics collection point."
            ),
        },
        "wrap": {
            "bin": "Soft Plastics — Store Drop-off",
            "recyclable": "Special Collection",
            "badge_variant": "warning",
            "instructions": (
                "Cling-film or stretch-wrap plastic cannot be recycled kerbside. "
                "Drop clean, dry film at a supermarket soft-plastics return point."
            ),
        },

        # Generic 'plastic' fallback (after specifics above)
        "plastic": {
            "bin": "Plastics / Recyclable",
            "recyclable": "Yes",
            "badge_variant": "success",
            "instructions": (
                "Check the resin code on the bottom (#1–#7). "
                "Rigid plastics (#1 PET, #2 HDPE) are usually kerbside-recyclable — rinse and replace cap. "
                "Soft plastics must go to a store drop-off, NOT the kerbside bin."
            ),
        },

        # ── Organic / Food waste ───────────────────────────────────────────────
        "organic": {
            "bin": "Organic / Compost",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": (
                "Scrape food waste into the organic / food-waste bin or home compost. "
                "Remove any plastic packaging or stickers before composting."
            ),
        },
        "food": {
            "bin": "Organic / Compost",
            "recyclable": "Compostable",
            "badge_variant": "warning",
            "instructions": (
                "Scrape leftovers into the organic / food-waste bin. "
                "Avoid placing cooked meat, oils, or dairy in home compost."
            ),
        },

        # ── Electronic / Battery ──────────────────────────────────────────────
        "battery": {
            "bin": "Hazardous / E-Waste",
            "recyclable": "Certified Drop-off Only",
            "badge_variant": "danger",
            "instructions": (
                "⚠ DO NOT place in any household bin — fire risk! "
                "Tape both terminals with electrical tape. "
                "Take to a certified e-waste or battery drop-off location."
            ),
        },
        "electronic": {
            "bin": "Hazardous / E-Waste",
            "recyclable": "Certified Drop-off Only",
            "badge_variant": "danger",
            "instructions": (
                "Electronics contain hazardous materials (lead, mercury, lithium). "
                "NEVER place in general or recycling bins. "
                "Drop off at a municipal e-waste collection event or certified facility."
            ),
        },
        "e_waste": {
            "bin": "Hazardous / E-Waste",
            "recyclable": "Certified Drop-off Only",
            "badge_variant": "danger",
            "instructions": (
                "Electronics contain hazardous materials (lead, mercury, lithium). "
                "NEVER place in general or recycling bins. "
                "Drop off at a municipal e-waste collection event or certified facility."
            ),
        },

        # ── Low-confidence fallback ────────────────────────────────────────────
        "uncertain": {
            "bin": "Manual Inspection Needed",
            "recyclable": "Unknown",
            "badge_variant": "secondary",
            "instructions": (
                "Detection confidence is too low to determine the material type. "
                "Please inspect this item manually before sorting."
            ),
        },
    }

    DEFAULT_RULE = {
        "bin": "General Waste",
        "recyclable": "No",
        "badge_variant": "secondary",
        "instructions": (
            "This item does not match a known recyclable category. "
            "Dispose in the general landfill / residual waste bin. "
            "Check your local council's A–Z recycling guide for unusual materials."
        ),
    }

    def evaluate(self, label: str, material: str = "", confidence: float = 0.0) -> Dict[str, Any]:
        """
        Evaluates detection and classification outputs against waste management rules.
        Uses longest-match strategy so more specific keys (e.g. 'plastic bag') beat
        generic ones (e.g. 'plastic').
        """
        combined = f"{label} {material}".lower()

        # Sort rules by key length descending so longer (more specific) keys match first
        for keyword in sorted(self.RULES.keys(), key=len, reverse=True):
            if keyword in combined:
                rule = self.RULES[keyword]
                return {
                    "disposal_bin": rule["bin"],
                    "recyclable": rule["recyclable"],
                    "badge_variant": rule["badge_variant"],
                    "instructions": rule["instructions"],
                    "confidence": confidence,
                }

        return {
            "disposal_bin": self.DEFAULT_RULE["bin"],
            "recyclable": self.DEFAULT_RULE["recyclable"],
            "badge_variant": self.DEFAULT_RULE["badge_variant"],
            "instructions": self.DEFAULT_RULE["instructions"],
            "confidence": confidence,
        }
