import React, { useState, useEffect } from 'react';
import { X, Code2, Database, Radio, Satellite, Zap, CheckCircle2, Copy, Check } from 'lucide-react';
import { ProviderStatus } from '../../types/nowcast';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderStatus | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/nowcast/providers')
        .then((res) => res.json())
        .then((data: ProviderStatus[]) => {
          setProviders(data);
          if (data.length > 0) setSelectedProvider(data[1] || data[0]); // Default to NEXRAD
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (selectedProvider) {
      navigator.clipboard.writeText(selectedProvider.integration_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'radar': return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'satellite': return <Satellite className="w-4 h-4 text-sky-400" />;
      case 'lightning': return <Zap className="w-4 h-4 text-amber-400" />;
      default: return <Database className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Extensible Sensor & API Provider Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Plug-and-play adapter layer for NOAA NEXRAD, GOES ABI/GLM, and Blitzortung live feeds
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Provider List */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-semibold mb-3">
              Data Ingestion Connectors
            </div>
            {providers.map((p) => {
              const isSelected = selectedProvider?.provider_id === p.provider_id;
              return (
                <button
                  key={p.provider_id}
                  onClick={() => setSelectedProvider(p)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex flex-col space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(p.category)}
                      <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                        {p.display_name.split('(')[0]}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                      p.status === 'connected' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {p.coverage_area}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Connector Details & Integration Code */}
          <div className="md:col-span-2 space-y-4 font-mono text-xs">
            {selectedProvider ? (
              <div className="space-y-4">
                {/* Connector Metadata */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-cyan-300 font-sans">
                      {selectedProvider.display_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Latency: ~{selectedProvider.latency_ms}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Source Protocol: </span>
                      <span className="text-slate-300">{selectedProvider.source_endpoint}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Coverage Domain: </span>
                      <span className="text-slate-300">{selectedProvider.coverage_area}</span>
                    </div>
                  </div>
                </div>

                {/* Integration Code Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Python Integration Hook</span>
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-1 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {selectedProvider.integration_snippet}
                  </pre>
                </div>

                {/* Architecture explanation */}
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-400 font-sans text-xs space-y-1.5">
                  <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Seamless API Integration Flow</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    All real and synthetic sources implement the abstract contracts in <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">backend/app/providers/base.py</code>. Switching from synthetic to live AWS NOAA NEXRAD S3 or GOES-16 GLM simply requires setting <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">ACTIVE_PROVIDER</code> in config without changing the AI nowcasting model or React client.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
