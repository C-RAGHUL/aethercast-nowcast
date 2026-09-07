"""
ML Nowcaster Trainer and Validation Pipeline.
Generates synthetic convective atmospheric feature sets, trains a Scikit-Learn
Gradient Boosting / Random Forest classifier for convective intensification and lightning risk,
and calculates meteorological evaluation metrics (CSI, FAR, POD, ROC-AUC, Brier Score).
"""
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, brier_score_loss

def generate_synthetic_training_data(n_samples: int = 2500) -> Tuple[np.ndarray, np.ndarray, list]:
    """
    Synthesizes meteorological feature tuples:
    [dBZ, CAPE (J/kg), Shear (kt), Cooling Rate (C/15min), Flash Rate (flashes/min), Lead Time (min)]
    Target: 1 if severe thunderstorm / active lightning develops, 0 otherwise.
    """
    rng = np.random.RandomState(42)
    
    # Feature ranges
    dbz = rng.uniform(10.0, 68.0, n_samples)
    cape = rng.uniform(500.0, 4500.0, n_samples)
    shear = rng.uniform(10.0, 60.0, n_samples)
    cooling_rate = rng.uniform(-14.0, 1.0, n_samples) # Negative is cooling
    flash_rate = rng.exponential(scale=15.0, size=n_samples)
    lead_time = rng.choice([0, 15, 30, 45, 60, 75, 90, 105, 120], n_samples)
    
    X = np.column_stack([dbz, cape, shear, cooling_rate, flash_rate, lead_time])
    
    # Atmospheric physics log-odds for convective hazard
    z = (
        (dbz - 38.0) * 0.12 +
        (cape - 1800.0) * 0.0011 +
        (shear - 30.0) * 0.045 +
        (-cooling_rate - 4.0) * 0.22 +
        (flash_rate - 12.0) * 0.06 -
        lead_time * 0.008
    )
    
    prob = 1.0 / (1.0 + np.exp(-z))
    y = (rng.uniform(0, 1, n_samples) < prob).astype(int)
    
    feature_names = [
        "radar_dbz",
        "cape_jkg",
        "bulk_shear_kt",
        "cloud_top_cooling_c",
        "flash_rate_per_min",
        "lead_time_min"
    ]
    
    return X, y, feature_names

class NowcastingModelTrainer:
    def __init__(self):
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        )
        self.metrics: Dict[str, Any] = {}

    def train_and_evaluate(self) -> Dict[str, Any]:
        X, y, feature_names = generate_synthetic_training_data(3000)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        
        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]
        
        # Meteorological Contingency Table Metrics
        # Hits (a), False Alarms (b), Misses (c), Correct Negatives (d)
        a = int(np.sum((y_pred == 1) & (y_test == 1)))
        b = int(np.sum((y_pred == 1) & (y_test == 0)))
        c = int(np.sum((y_pred == 0) & (y_test == 1)))
        d = int(np.sum((y_pred == 0) & (y_test == 0)))
        
        # Critical Success Index (CSI) / Threat Score = a / (a + b + c)
        csi = a / (a + b + c) if (a + b + c) > 0 else 0.0
        # Probability of Detection (POD) = a / (a + c)
        pod = a / (a + c) if (a + c) > 0 else 0.0
        # False Alarm Ratio (FAR) = b / (a + b)
        far = b / (a + b) if (a + b) > 0 else 0.0
        
        auc = float(roc_auc_score(y_test, y_prob))
        brier = float(brier_score_loss(y_test, y_prob))
        
        importances = {
            name: round(float(imp), 4)
            for name, imp in zip(feature_names, self.model.feature_importances_)
        }
        
        self.metrics = {
            "critical_success_index_csi": round(csi, 3),
            "probability_of_detection_pod": round(pod, 3),
            "false_alarm_ratio_far": round(far, 3),
            "roc_auc_score": round(auc, 3),
            "brier_score": round(brier, 4),
            "feature_importances": importances,
            "test_samples": len(y_test),
            "contingency_table": {"hits": a, "false_alarms": b, "misses": c, "correct_negatives": d}
        }
        
        return self.metrics

if __name__ == "__main__":
    trainer = NowcastingModelTrainer()
    results = trainer.train_and_evaluate()
    print("Training Results:")
    for k, v in results.items():
        print(f"  {k}: {v}")
