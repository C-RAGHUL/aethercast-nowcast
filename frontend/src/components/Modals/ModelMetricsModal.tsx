import React, { useState, useEffect } from 'react';
import { X, Sparkles, BarChart3, Target, Award, ShieldCheck, CheckCircle } from 'lucide-react';

interface ModelMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelMetricsModal: React.FC<ModelMetricsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/nowcast/model-metrics')
        .then((res) => res.json())
        .then(setMetrics)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                AI / ML Nowcasting Model Performance & Validation
              </h2>
              <p className="text-xs text-slate-400">
                Gradient Boosting Convective Ensemble & Meteorological Contingency Metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs">
          {metrics ? (
            <>
              {/* Primary Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Threat Score (CSI)
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {metrics.critical_success_index_csi}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target: &gt; 0.65</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Prob of Detection (POD)
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {metrics.probability_of_detection_pod}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target: &gt; 0.80</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    False Alarm Ratio (FAR)
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {metrics.false_alarm_ratio_far}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target: &lt; 0.25</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    ROC-AUC Score
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {metrics.roc_auc_score}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Brier: {metrics.brier_score}</div>
                </div>
              </div>

              {/* Feature Importance Breakdown */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-slate-300 font-sans font-semibold text-xs border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Ensemble Feature Importances (Gini Impurity Reduction)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Total: 100%</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {Object.entries(metrics.feature_importances).map(([name, val]: [string, any]) => {
                    const pct = Math.round(val * 100);
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 capitalize">{name.replace(/_/g, ' ')}</span>
                          <span className="text-cyan-300 font-bold">{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contingency Table */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2 font-mono">
                <div className="text-xs font-semibold text-slate-300 font-sans mb-2">
                  2x2 Contingency Verification Matrix (Test Set: {metrics.test_samples} storms)
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded">
                    <div className="text-slate-400 text-[10px]">HITS (Forecast Yes / Observed Yes)</div>
                    <div className="text-emerald-400 font-bold text-lg">{metrics.contingency_table?.hits}</div>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded">
                    <div className="text-slate-400 text-[10px]">FALSE ALARMS (Forecast Yes / Observed No)</div>
                    <div className="text-amber-400 font-bold text-lg">{metrics.contingency_table?.false_alarms}</div>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded">
                    <div className="text-slate-400 text-[10px]">MISSES (Forecast No / Observed Yes)</div>
                    <div className="text-rose-400 font-bold text-lg">{metrics.contingency_table?.misses}</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                    <div className="text-slate-400 text-[10px]">CORRECT NEGATIVES (Forecast No / Observed No)</div>
                    <div className="text-slate-300 font-bold text-lg">{metrics.contingency_table?.correct_negatives}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">Loading model evaluation metrics...</div>
          )}
        </div>
      </div>
    </div>
  );
};
