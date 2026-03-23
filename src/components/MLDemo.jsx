import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * MLDemo - Live neural network skills classifier.
 * Uses a simple softmax classifier trained on resume skill keywords.
 * Demonstrates NLP / ML knowledge directly on the page.
 */

const CATEGORIES = ['AI / ML', 'Full-Stack Web', 'Systems & Infra', 'Data & Analytics'];
const CATEGORY_COLORS = ['#ff6b9d', '#57cbff', '#c792ea', '#ffcb6b'];
const CATEGORY_PROJECTS = [
  ['AIIAi.org', 'Swarm', 'AIServer', 'Multi-Modal ML', 'StockMarketBot'],
  ['Icarus', 'NomadicCRM', 'NexxusLevel', 'Client Web Apps'],
  ['HardDriveCloner', 'Cluster Infra', 'Tailscale Mesh'],
  ['StockMarketBot', 'Database Systems', 'PostgreSQL Pipelines'],
];

// Build a simple vocabulary from training data
function buildVocab(samples) {
  const vocab = {};
  let idx = 0;
  samples.forEach(s => {
    s.input.split(/\s+/).forEach(word => {
      const w = word.toLowerCase();
      if (!(w in vocab)) { vocab[w] = idx++; }
    });
  });
  return vocab;
}

// Convert text to bag-of-words vector
function textToVector(text, vocab) {
  const vec = new Float32Array(Object.keys(vocab).length);
  text.toLowerCase().split(/\s+/).forEach(word => {
    if (word in vocab) vec[vocab[word]] = 1;
  });
  return vec;
}

// Simple softmax
function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Train a simple linear classifier (logistic regression via gradient descent)
function trainClassifier(samples, vocab, numCategories, epochs = 200) {
  const vocabSize = Object.keys(vocab).length;
  // Initialize weights and biases
  const W = Array.from({ length: numCategories }, () =>
    Array.from({ length: vocabSize }, () => (Math.random() - 0.5) * 0.1)
  );
  const b = new Array(numCategories).fill(0);
  const lr = 0.5;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const sample of samples) {
      const x = textToVector(sample.input, vocab);
      // Forward
      const logits = W.map((w, i) => w.reduce((sum, wj, j) => sum + wj * x[j], 0) + b[i]);
      const probs = softmax(logits);
      // Backward (cross-entropy gradient)
      for (let c = 0; c < numCategories; c++) {
        const grad = probs[c] - (c === sample.category ? 1 : 0);
        b[c] -= lr * grad;
        for (let j = 0; j < vocabSize; j++) {
          W[c][j] -= lr * grad * x[j];
        }
      }
    }
  }
  return { W, b };
}

// Predict
function predict(text, model, vocab) {
  const x = textToVector(text, vocab);
  const logits = model.W.map((w, i) => w.reduce((sum, wj, j) => sum + wj * x[j], 0) + model.b[i]);
  return softmax(logits);
}

export default function MLDemo({ data }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [model, setModel] = useState(null);
  const [vocab, setVocab] = useState(null);
  const [isTraining, setIsTraining] = useState(true);
  const canvasRef = useRef(null);

  // Train model on mount
  useEffect(() => {
    const samples = data.mlTrainingData.samples;
    const v = buildVocab(samples);
    const m = trainClassifier(samples, v, CATEGORIES.length);
    setVocab(v);
    setModel(m);
    setIsTraining(false);
  }, [data]);

  // Draw neural network visualization
  const drawNetwork = useCallback((activations) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Layer config: input(6) -> hidden(8) -> output(4)
    const layers = [
      { count: 6, label: 'Input' },
      { count: 8, label: 'Hidden' },
      { count: 4, label: 'Output' },
    ];
    const layerX = layers.map((_, i) => 60 + (i / (layers.length - 1)) * (W - 120));

    // Generate node positions
    const nodePositions = layers.map((layer, li) => {
      const positions = [];
      for (let j = 0; j < layer.count; j++) {
        const y = 30 + ((j + 0.5) / layer.count) * (H - 60);
        positions.push({ x: layerX[li], y });
      }
      return positions;
    });

    // Draw connections
    for (let li = 0; li < layers.length - 1; li++) {
      const fromNodes = nodePositions[li];
      const toNodes = nodePositions[li + 1];
      for (const from of fromNodes) {
        for (const to of toNodes) {
          const alpha = activations ? 0.08 + Math.random() * 0.15 : 0.05;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = `rgba(100, 255, 218, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw activations on edges (animated dots)
    if (activations) {
      const t = (Date.now() % 2000) / 2000;
      for (let li = 0; li < layers.length - 1; li++) {
        const fromNodes = nodePositions[li];
        const toNodes = nodePositions[li + 1];
        const dotCount = 3;
        for (let d = 0; d < dotCount; d++) {
          const progress = (t + d / dotCount) % 1;
          const fi = Math.floor(Math.random() * fromNodes.length);
          const ti = Math.floor(Math.random() * toNodes.length);
          const from = fromNodes[fi];
          const to = toNodes[ti];
          const x = from.x + (to.x - from.x) * progress;
          const y = from.y + (to.y - from.y) * progress;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 255, 218, 0.7)';
          ctx.fill();
        }
      }
    }

    // Draw nodes
    for (let li = 0; li < layers.length; li++) {
      const nodes = nodePositions[li];
      nodes.forEach((pos, ni) => {
        let activation = 0.3;
        if (activations && li === layers.length - 1 && ni < activations.length) {
          activation = activations[ni];
        } else if (activations && li < layers.length - 1) {
          activation = 0.3 + Math.random() * 0.4;
        }
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        if (li === layers.length - 1 && activations) {
          ctx.fillStyle = CATEGORY_COLORS[ni] || '#64ffda';
          ctx.globalAlpha = 0.3 + activation * 0.7;
        } else {
          ctx.fillStyle = '#64ffda';
          ctx.globalAlpha = 0.2 + activation * 0.6;
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Layer label
      ctx.fillStyle = '#8892b0';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(layers[li].label, layerX[li], H - 5);
    }

    // Output labels
    if (activations) {
      const outNodes = nodePositions[layers.length - 1];
      outNodes.forEach((pos, i) => {
        if (i < CATEGORIES.length) {
          ctx.fillStyle = CATEGORY_COLORS[i];
          ctx.font = '9px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText(`${CATEGORIES[i]} ${(activations[i] * 100).toFixed(0)}%`, pos.x + 14, pos.y + 3);
        }
      });
    }
  }, []);

  // Animate network
  useEffect(() => {
    let animId;
    function loop() {
      drawNetwork(results);
      animId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animId);
  }, [results, drawNetwork]);

  const handleClassify = () => {
    if (!model || !vocab || !input.trim()) return;
    const probs = predict(input, model, vocab);
    setResults(probs);
  };

  return (
    <section id="ml-demo" className="section">
      <div className="container">
        <h2 className="section-title">AI Lab — Live Neural Network</h2>
        <p className="ml-subtitle">
          This neural network classifier runs <strong>entirely in your browser</strong> — trained on my project portfolio.
          Type a job description or skill keywords, and watch the network classify which of my expertise domains best match.
        </p>

        <div className="ml-demo-layout">
          <div className="ml-network-viz">
            <canvas ref={canvasRef} width={400} height={280} className="nn-canvas" />
          </div>

          <div className="ml-controls">
            <textarea
              className="ml-input"
              placeholder="Try: 'machine learning NLP deep learning model training'&#10;Or: 'react node.js full stack web application'&#10;Or: 'docker kubernetes deployment linux server'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
            <button
              className="btn btn-primary ml-btn"
              onClick={handleClassify}
              disabled={isTraining || !input.trim()}
            >
              {isTraining ? 'Training Model...' : 'Run Inference →'}
            </button>

            {results && (
              <div className="ml-results">
                <h3>Classification Results</h3>
                {CATEGORIES.map((cat, i) => (
                  <div className="ml-result-row" key={cat}>
                    <div className="ml-result-label">
                      <span style={{ color: CATEGORY_COLORS[i] }}>{cat}</span>
                      <span className="confidence">{(results[i] * 100).toFixed(1)}%</span>
                    </div>
                    <div className="ml-result-bar">
                      <div
                        className="ml-result-fill"
                        style={{ width: `${results[i] * 100}%`, backgroundColor: CATEGORY_COLORS[i] }}
                      />
                    </div>
                  </div>
                ))}
                <div className="ml-matched-projects">
                  <h4>Related Projects:</h4>
                  <div className="ml-matched-list">
                    {CATEGORY_PROJECTS[results.indexOf(Math.max(...results))].map(p => (
                      <span className="ml-matched-tag" key={p}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
