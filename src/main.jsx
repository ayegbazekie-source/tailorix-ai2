import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { runStage1Benchmarks } from './tests/stage1Benchmark';
import { runStage2Benchmarks } from './tests/stage2Benchmark';
import { runStage2_5Benchmark } from './tests/stage2_5Benchmark';

// Register automated benchmarks on global window for developer access
if (typeof window !== 'undefined') {
  window.runTailorixBenchmarks = runStage1Benchmarks;
  window.runTailorixStage2Benchmarks = runStage2Benchmarks;
  window.runTailorixStage2_5Benchmark = runStage2_5Benchmark;
  try {
    const report = runStage1Benchmarks();
    console.log('[TAILORIX STAGE 1 BENCHMARKS COMPLETED]', report.summary);
    if (import.meta.env.DEV) {
      runStage2_5Benchmark().then((res) => {
        console.log('[TAILORIX STAGE 2.5 BENCHMARK COMPLETED]', `${res.passed}/${res.total} passed`);
      });
    }
  } catch (err) {
    console.error('[TAILORIX BENCHMARK ERROR]', err);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
