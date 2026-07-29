'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Classifier() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modelChoice, setModelChoice] = useState('resnet');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('model_choice', modelChoice);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Prediction failed.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to connect to AI Inference Backend (localhost:8000).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="classifier-section" className="relative z-50 min-h-screen bg-[#070c09] text-white py-20 px-6 md:px-12 lg:px-20 border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.9)]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-mono tracking-[3px] text-[#b6ff2a] uppercase bg-[#b6ff2a]/10 px-4 py-1.5 rounded-full border border-[#b6ff2a]/20 mb-4">
            AI Diagnostics Engine • Live Terminal
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Instant Crop Disease Analysis
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg">
            Upload a leaf image below to run instant neural network inference against 38 plant disease classes.
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={() => setModelChoice('resnet')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border ${
              modelChoice === 'resnet'
                ? 'bg-[#b6ff2a] text-[#051a08] border-[#b6ff2a] shadow-[0_0_20px_rgba(182,255,42,0.3)]'
                : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
            }`}
          >
            ResNet18 Transfer Learning
          </button>
          <button
            onClick={() => setModelChoice('cnn')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border ${
              modelChoice === 'cnn'
                ? 'bg-[#b6ff2a] text-[#051a08] border-[#b6ff2a] shadow-[0_0_20px_rgba(182,255,42,0.3)]'
                : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
            }`}
          >
            Custom 3-Layer CNN
          </button>
        </div>

        {/* Main Grid: Upload Dropzone & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload Dropzone */}
          <div className="lg:col-span-5 bg-[#0d1711] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b6ff2a]"></span>
              Input Leaf Image
            </h3>

            <label className="border-2 border-dashed border-white/20 hover:border-[#b6ff2a]/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-[#b6ff2a]/[0.02] group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 border border-white/10">
                  {/* eslint-disable-next-html-link */}
                  <img
                    src={previewUrl}
                    alt="Uploaded leaf preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#b6ff2a] group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm text-white/80">Click or drag leaf image here</span>
                  <span className="text-xs text-white/40 mt-1">Supports JPG, PNG, JPEG</span>
                </div>
              )}
            </label>

            {selectedFile && (
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full mt-6 py-4 bg-[#b6ff2a] hover:bg-[#c5ff4f] text-[#051a08] font-bold text-base rounded-2xl shadow-[0_10px_25px_rgba(182,255,42,0.3)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#051a08] border-t-transparent rounded-full animate-spin"></div>
                    <span>Running Neural Network...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Diagnosis</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Diagnostics Telemetry Results */}
          <div className="lg:col-span-7 bg-[#0d1711] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl min-h-[480px]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b6ff2a]"></span>
              Diagnostic Telemetry Output
            </h3>

            {result ? (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  result.is_healthy
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider block opacity-70">Primary Status</span>
                    <span className="text-xl font-extrabold">{result.diagnosis_formatted}</span>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    result.is_healthy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300 animate-pulse'
                  }`}>
                    {result.is_healthy ? 'Healthy Leaf' : 'Disease Detected'}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[11px] font-mono text-white/40 block uppercase">Confidence</span>
                    <span className="text-2xl font-bold text-[#b6ff2a]">{result.confidence}%</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[11px] font-mono text-white/40 block uppercase">Severity Index</span>
                    <span className="text-2xl font-bold text-amber-400">{result.severity}%</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[11px] font-mono text-white/40 block uppercase">Latency</span>
                    <span className="text-2xl font-bold text-sky-400">{result.inference_ms}ms</span>
                  </div>
                </div>

                {/* Top 3 Probability Spectrum */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Top 3 Probability Spectrum</h4>
                  <div className="space-y-3">
                    {result.top3?.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between text-xs font-medium mb-1.5">
                          <span className="text-white/90">{item.formatted}</span>
                          <span className="font-mono text-[#b6ff2a]">{item.confidence}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#b6ff2a] rounded-full transition-all duration-500"
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Guidelines */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div>
                    <h5 className="text-xs font-mono uppercase tracking-wider text-[#b6ff2a] mb-1">Case Description</h5>
                    <p className="text-sm text-white/80 leading-relaxed">{result.description}</p>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <h5 className="text-xs font-mono uppercase tracking-wider text-[#b6ff2a] mb-1">Recommended Action Plan</h5>
                    <p className="text-sm text-white/80 leading-relaxed">{result.treatment}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-white/30 border-2 border-dashed border-white/10 rounded-2xl">
                <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Awaiting Inference Execution</span>
                <span className="text-xs opacity-60 mt-1">Upload a leaf image on the left to display diagnostics</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
