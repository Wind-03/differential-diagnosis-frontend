import { useEffect, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { DiagnosisResponse } from '../types';

function riskTier(prob: number): { color: string; label: string; className: string } {
  if (prob >= 0.66) return { color: '#E5484D', label: 'High', className: 'text-riskhigh' };
  if (prob >= 0.33) return { color: '#F2A93B', label: 'Moderate', className: 'text-riskmoderate' };
  return { color: '#3FA796', label: 'Low', className: 'text-risklow' };
}

export default function DiagnosisCard({ result }: { result: DiagnosisResponse }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 30);
    return () => clearTimeout(t);
  }, [result]);

  const primaryExplanation =
    result.primary_diagnosis === 'COVID-19' ? result.covid_explanation : result.malaria_explanation;
  const primaryLabel = result.primary_diagnosis === 'COVID-19' ? 'COVID-19' : 'Malaria';
  const confidenceTier = riskTier(result.confidence);

  const maxMagnitude = Math.max(...primaryExplanation.top_factors.map((f) => f.magnitude), 0.001);

  return (
    <div className={`dd-fade ${revealed ? 'dd-in' : ''} flex flex-col gap-3 max-w-2xl`}>
      {/* Headline */}
      <div className="bg-panel border border-panelBorder rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-panelBorder text-[10.5px] tracking-wide">PRIMARY DIAGNOSIS</div>
          <div className="font-display text-white text-lg font-semibold">{result.full_diagnosis}</div>
        </div>
        <div
          className={`font-mono px-3 py-1.5 rounded-lg text-sm font-semibold ${confidenceTier.className}`}
          style={{ backgroundColor: `${confidenceTier.color}22`, border: `1px solid ${confidenceTier.color}88` }}
        >
          {(result.confidence * 100).toFixed(1)}% confidence
        </div>
      </div>

      {/* Probability readouts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Malaria', prob: result.malaria_probability, tag: null as string | null },
          { label: 'COVID-19', prob: result.covid_probability, tag: 'provisional' },
        ].map((m) => {
          const tier = riskTier(m.prob);
          return (
            <div key={m.label} className="bg-panel border border-panelBorder rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white text-xs font-medium">{m.label}</span>
                {m.tag && (
                  <span className="text-riskmoderate text-[9.5px] uppercase tracking-wide">{m.tag}</span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className={`font-mono text-[19px] font-semibold ${tier.className}`}>
                  {(m.prob * 100).toFixed(1)}%
                </span>
                <span className="text-[#8FA1A7] text-[10px]">{tier.label} likelihood</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-black/25">
                <div
                  className="dd-bar h-full rounded-full"
                  style={{ width: revealed ? `${m.prob * 100}%` : '0%', backgroundColor: tier.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vital-strip explanation */}
      <div className="bg-panel border border-panelBorder rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-white text-[13px] font-semibold">
            Why — {primaryLabel} model
          </span>
          <span className="text-[#8FA1A7] text-[10.5px]">
            base rate {(primaryExplanation.base_rate_probability * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {primaryExplanation.top_factors.map((f, i) => {
            const increases = f.direction === 'increases';
            const pct = (f.magnitude / maxMagnitude) * 50;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="text-[#8FA1A7] text-[11px] w-[150px] text-right flex-shrink-0 truncate">
                  {f.feature.replace(/_/g, ' ')}
                  <span className="font-mono text-white ml-1">
                    {Number.isInteger(f.value) ? f.value : Number(f.value).toFixed(1)}
                  </span>
                </div>
                <div className="flex-1 flex items-center h-4 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-panelBorder" />
                  <div className="w-1/2 flex justify-end">
                    {!increases && (
                      <div
                        className="dd-bar h-3 rounded-l bg-protective"
                        style={{ width: revealed ? `${pct}%` : '0%' }}
                      />
                    )}
                  </div>
                  <div className="w-1/2 flex justify-start">
                    {increases && (
                      <div
                        className="dd-bar h-3 rounded-r"
                        style={{ width: revealed ? `${pct}%` : '0%', backgroundColor: confidenceTier.color }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-panelBorder">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: confidenceTier.color }} />
            <span className="text-[#8FA1A7] text-[10px]">increases risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-protective" />
            <span className="text-[#8FA1A7] text-[10px]">decreases risk</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-panel border border-panelBorder rounded-2xl p-4">
        <div className="font-display text-white text-[13px] font-semibold mb-2.5">Recommendations</div>
        <div className="flex flex-col gap-2">
          {result.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-risklow flex-shrink-0 mt-0.5" />
              <span className="text-white text-[12.5px]">{r.replace(/^[^\w]+/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {result.covid_model_status && (
        <div className="text-[#8FA1A7] text-[10.5px] px-1 flex items-center gap-1.5">
          <Info size={11} />
          COVID-19 model status: {result.covid_model_status}
        </div>
      )}
    </div>
  );
}
