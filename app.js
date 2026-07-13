const { useState, useEffect } = React;
const { ChevronRight, ChevronLeft, Activity, Database, Server, AlertTriangle, ShieldCheck, PieChart, BellRing, Cloud } = lucide;

const slides = [
  {
    id: "title",
    content: () => (
      <div className="title-slide">
        <Activity size={80} color="var(--accent-blue)" style={{marginBottom: '2rem'}} />
        <h1>Observability for SREs</h1>
        <p>Mastering Metrics, Logs & Traces on GCP & AWS</p>
        <div style={{marginTop: '2rem', display: 'flex', gap: '1rem'}}>
          <span className="tag tag-gcp">Google Cloud</span>
          <span className="tag tag-aws">AWS</span>
        </div>
      </div>
    )
  },
  {
    id: "pillars",
    content: () => (
      <div>
        <h2>The 3 Pillars of Observability</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Why it's more than just monitoring.</p>
        
        <div className="grid-2" style={{gridTemplateColumns: '1fr 1fr 1fr'}}>
          <div className="card">
            <div className="icon-box" style={{background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa'}}>
              <PieChart />
            </div>
            <h3>Metrics</h3>
            <p>Numeric data measured over intervals of time. (e.g. CPU Usage, Request Rate)</p>
          </div>
          <div className="card">
            <div className="icon-box" style={{background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc'}}>
              <Database />
            </div>
            <h3>Logs</h3>
            <p>Immutable, timestamped record of discrete events. Rich context but high volume.</p>
          </div>
          <div className="card">
            <div className="icon-box" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#34d399'}}>
              <Activity />
            </div>
            <h3>Traces</h3>
            <p>A representation of a series of causally related distributed events. End-to-end flow.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "log-journey",
    content: () => (
      <div>
        <h2>The Log Journey</h2>
        <p style={{color: 'var(--text-muted)'}}>From Kubernetes Nodes to Storage & Streaming</p>
        
        <div className="flow-diagram">
          <div className="flow-node">K8s Pods / Node</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node" style={{borderColor: 'var(--accent-purple)'}}>DaemonSet<br/><small>(Fluent Bit/Fluentd)</small></div>
          <div className="flow-arrow">→</div>
          <div className="flow-node" style={{borderColor: 'var(--gcp-color)'}}>Cloud Logging (GCP)<br/>S3 (AWS)</div>
        </div>

        <h3 style={{marginTop: '3rem'}}>Data Streaming for Advanced Observability</h3>
        <div className="flow-diagram" style={{marginTop: '1rem'}}>
          <div className="flow-node">DaemonSet</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">Kafka<br/><small>(Buffer & Decouple)</small></div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">OpenTelemetry<br/>Collector</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">Pub/Sub / Backend</div>
        </div>
      </div>
    )
  },
  {
    id: "enterprise-tools",
    content: () => (
      <div>
        <h2>Enterprise Tools: Datadog vs Dynatrace</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Where do commercial APMs fit in the flow?</p>
        
        <div className="grid-2">
          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span className="tag tag-datadog">Datadog</span>
            </h3>
            <ul>
              <li><strong>Position:</strong> Integrates directly via agents or reads from OTel/Cloud APIs.</li>
              <li><strong>Strengths:</strong> Amazing custom Dashboards, huge ecosystem of integrations, Cloud-native friendly.</li>
              <li><strong>Pros:</strong> Easy to setup, dev-friendly.</li>
              <li><strong>Cons:</strong> Cost can spike dramatically due to custom metrics and log ingestion volume.</li>
            </ul>
          </div>
          
          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span className="tag tag-dynatrace">Dynatrace</span>
            </h3>
            <ul>
              <li><strong>Position:</strong> Deep APM instrumentation using OneAgent.</li>
              <li><strong>Strengths:</strong> AI-driven (Davis AI) root cause analysis, automatic discovery of topologies.</li>
              <li><strong>Pros:</strong> Reduces MTTR significantly, highly automated.</li>
              <li><strong>Cons:</strong> High learning curve, premium pricing.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "banking-usecase",
    content: () => (
      <div>
        <h2>Use Case: Banking App</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Features: Transfer, Pay, Top-up, Withdraw</p>
        
        <div className="card" style={{marginBottom: '1.5rem'}}>
          <h3 style={{display: 'flex', alignItems:'center', gap:'0.5rem'}}><AlertTriangle color="#ef4444"/> Scenario: "Transfer Failed or Very Slow"</h3>
          <p>How Observability helps us solve this:</p>
        </div>

        <div className="grid-2">
          <div className="card">
            <h4>1. Log-based Metrics</h4>
            <p>We parse logs to extract a metric: <code>transfer_failure_count</code>. If it spikes, alert immediately.</p>
          </div>
          <div className="card">
            <h4>2. Distributed Tracing</h4>
            <p>Using a <code>Trace ID</code>, we track the request: Mobile App → API Gateway → Auth Service → Core Banking. Find exactly which hop is causing the 5-second delay.</p>
          </div>
          <div className="card">
            <h4>3. Datadog / Dynatrace</h4>
            <p>Dynatrace's AI flags that the DB connection pool in the Core Banking service is exhausted, pointing directly to the root cause without manual log hunting.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "grafana",
    content: () => (
      <div>
        <h2>Grafana & Alerting (Part 2)</h2>
        <p style={{color: 'var(--text-muted)'}}>Connecting the dots for actionable insights.</p>
        
        <div className="grid-2" style={{marginTop: '2rem'}}>
          <div className="card">
            <div className="icon-box" style={{background: 'rgba(244, 122, 32, 0.2)', color: '#F47A20'}}>
              <PieChart />
            </div>
            <h3>1. Grafana Dashboards</h3>
            <p>Connect to Prometheus or CloudWatch. Build a dashboard specifically for the Banking App (e.g. Success vs Failure rate for Top-ups).</p>
          </div>
          
          <div className="card">
            <div className="icon-box" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444'}}>
              <AlertTriangle />
            </div>
            <h3>2. Thresholds & Alerts</h3>
            <p>Set a rule: <code>avg(transfer_latency) &gt; 2s</code> for 5 minutes. If breached, trigger an Alarm state.</p>
          </div>
          
          <div className="card" style={{gridColumn: '1 / -1'}}>
            <div className="icon-box" style={{background: 'rgba(88, 101, 242, 0.2)', color: '#5865F2'}}>
              <BellRing />
            </div>
            <h3>3. Discord Integration</h3>
            <p>Setup a Contact Point in Grafana using a Discord Webhook URL. Alerts instantly ping the #sre-alerts channel with context and a link to the dashboard.</p>
          </div>
        </div>
      </div>
    )
  }
];

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(c => c - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="presentation-container">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: \`\${progress}%\` }}></div>
      </div>
      
      <div className="slide-content">
        {slides[currentSlide].content()}
      </div>

      <div className="controls">
        <span style={{color: 'var(--text-muted)'}}>
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn" onClick={prevSlide} disabled={currentSlide === 0}>
            <ChevronLeft size={20} /> Prev
          </button>
          <button className="btn btn-primary" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            Next <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
