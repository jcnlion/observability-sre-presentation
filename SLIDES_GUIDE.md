# 📚 SRE Observability — คู่มืออธิบายทุก Slide

> เอกสารนี้อธิบายเนื้อหา แนวคิด และ flow ที่ปรากฏในแต่ละ slide  
> เหมาะสำหรับใช้ทบทวน ศึกษาเพิ่มเติม หรือ reference ขณะนำเสนอ

---

## 📑 สารบัญ

| Slide | หัวข้อ | กลุ่ม |
|-------|--------|-------|
| 1 | Title — SRE Observability | Intro |
| 2 | The 3 Pillars of Observability | Core Concept |
| 3 | The Four Golden Signals | Core Concept |
| 4 | Log Journey: Extraction | Architecture |
| 5 | Log Journey: Processing & Storage | Architecture |
| 6 | Tracing Deep Dive | Core Concept |
| 7 | Observability Ecosystem | Tools |
| 8 | Banking App Use Case | Use Case |
| 9 | Grafana & Alerting | Tools |
| 10 | Operational Excellence | Practice |
| 11 | AWS CloudWatch Metrics | Tools/Cloud |
| 12 | OpenSearch Log Search | Tools |
| 13 | Datadog APM Overview | Tools |
| 14 | Dynatrace AI-Driven Insights | Tools |
| 15 | Datadog: Integration Points | Tools |
| 16 | Dynatrace: Integration Points | Tools |
| 17 | Integration Architecture: Big Picture | Architecture |
| 18 | Flow Comparison Overview | Flow |
| 19 | Flow B — Direct to OpenSearch | Flow |
| 20 | Flow C — AWS Native | Flow |
| 21 | Flow D — GCP Native | Flow |
| 22 | Flow E — Datadog Full Flow | Flow |
| 23 | Flow F — Dynatrace OneAgent | Flow |
| 24 | Flow G — Splunk | Flow |

---

## Slide 1 — Title

### 🎯 ประเด็นหลัก
Observability for SREs คือการทำให้ระบบ "อธิบายตัวเองได้" (self-explanatory) เมื่อเกิดปัญหา แทนที่จะต้องเดาหรือ SSH เข้าไปดูทีละ machine

### 💡 ทำไม Observability ถึงสำคัญ?
- Monitoring แบบเดิม = รู้ว่า **อะไรพัง**
- Observability = รู้ว่า **ทำไมถึงพัง** และ **พังที่ไหน**
- ในโลก microservices 100+ service การ debug โดยไม่มี observability คือฝันร้าย

---

## Slide 2 — The 3 Pillars of Observability

### 🎯 แนวคิดหลัก
3 Pillars คือรากฐานของ Observability ทุกอย่าง ใช้ร่วมกันจึงจะแก้ปัญหาได้

### 📊 Metrics (ตัวเลข)
- **คืออะไร**: ข้อมูลตัวเลขที่วัดต่อเนื่องตามเวลา
- **ใช้ตอบ**: "ตอนนี้ระบบสุขภาพดีมั้ย?" / "มี trend ผิดปกติมั้ย?"
- **ประเภท**:
  - **Counter** — นับสะสม เพิ่มขึ้นอย่างเดียว (`total_requests = 1,234,567`)
  - **Gauge** — ค่าปัจจุบัน ขึ้นลงได้ (`memory_used_mb = 2048`)
  - **Histogram** — distribution ของค่า ใช้คำนวณ P50/P95/P99 (`request_latency_seconds`)
- **เครื่องมือ**: Prometheus, CloudWatch, Datadog Metrics, InfluxDB

### 💾 Logs (บันทึกเหตุการณ์)
- **คืออะไร**: ข้อความบันทึกเหตุการณ์แต่ละครั้ง พร้อม timestamp
- **ใช้ตอบ**: "เกิดอะไรขึ้นกับ request นี้โดยละเอียด?"
- **Log Levels** (เรียงตามความรุนแรง):
  ```
  DEBUG < INFO < WARN < ERROR < FATAL
  ```
- **Best practice**: Production ควร set level `INFO` หรือ `WARN` — `DEBUG` สร้าง log volume มหาศาลและเปลือง cost
- **Structured Log (JSON)** ดีกว่า Plain Text เพราะ machine parse ได้ทันที:
  ```json
  {"level":"ERROR","service":"transfer","traceId":"abc","reason":"timeout","ts":"2025-07-14T06:00:00Z"}
  ```

### 📈 Traces (เส้นทาง request)
- **คืออะไร**: ติดตาม 1 request ตลอดการเดินทางข้าม service ต่าง ๆ
- **ใช้ตอบ**: "request ช้าอยู่ที่ service ไหน?"
- **โครงสร้าง**:
  - **Trace** = การเดินทางทั้งหมด (มี Trace ID เดียว)
  - **Span** = operation ย่อย แต่ละ hop (มี Span ID ของตัวเอง)
  - Span ลูกรู้จัก Parent Span ID → ต่อสายกันเป็น tree ได้
- **เครื่องมือ**: Jaeger, Grafana Tempo, Datadog APM, AWS X-Ray, Dynatrace

> **Key Insight**: ใช้ทั้ง 3 ร่วมกัน — Metrics บอกว่ามีปัญหา, Logs บอกรายละเอียด, Traces บอกว่าปัญหาอยู่ที่ไหนใน chain

---

## Slide 3 — The Four Golden Signals

### 🎯 แนวคิดหลัก
Google SRE Book ระบุว่า 4 metric นี้คือสิ่งที่ทุก service ควร monitor เป็นอย่างน้อย

### ⏱️ 1. Latency (ความหน่วง)
- **วัดอะไร**: เวลาที่ใช้ตอบ request
- **ข้อควรระวัง**: แยก latency ของ **success** กับ **error** ออกจากกัน เพราะ error มักตอบเร็ว (fail fast) ซึ่งทำให้ average ดูดีเกินจริง
- **Percentile ที่ควรใช้**:
  - **P50**: ครึ่งหนึ่งของ user ได้รับเร็วกว่านี้ (median)
  - **P95**: 95% ของ user ได้รับเร็วกว่านี้
  - **P99**: วัด worst-case experience สำหรับ power user / VIP
  - ⚠️ **อย่าใช้ Average อย่างเดียว** — outlier ทำให้ค่า distort ได้
- **SLO ทั่วไป**: P99 latency < 500ms สำหรับ API

### 🌊 2. Traffic (ปริมาณการใช้งาน)
- **วัดอะไร**: ความต้องการที่ระบบรับอยู่
- **ตัวอย่าง**: HTTP RPS, Active WebSocket connections, Kafka message/sec, DB queries/sec
- **ใช้ร่วมกับ Latency**: ถ้า Traffic เพิ่มแล้ว Latency พุ่ง → หา saturation point เพื่อ scale ก่อนพัง

### ❌ 3. Errors (ข้อผิดพลาด)
- **วัดอะไร**: อัตราส่วน request ที่ล้มเหลว
- **2 ประเภท**:
  - **Explicit**: HTTP 5xx, gRPC non-OK status — ชัดเจน ระบบรายงานเอง
  - **Implicit**: HTTP 200 แต่ body มี `"status": "failed"` — ต้อง parse log จึงจะรู้
- **Error Rate** = errors / total requests × 100%
- **SLO ทั่วไป**: Error rate < 0.1%

### 🧽 4. Saturation (ความอิ่มตัว)
- **วัดอะไร**: ระบบกำลังทรัพยากรเหลือน้อยแค่ไหน
- **เป็น Leading Indicator** — Saturation สูงหมายความว่าปัญหาจะตามมา ต้อง act ก่อนที่จะ alert
- **ตัวอย่าง metrics ที่ต้อง watch**:
  - CPU utilization > 80% sustained
  - DB connection pool > 80% full
  - Memory approaching limit → OOMKilled
  - Disk IOPS hitting ceiling

---

## Slide 4 — Log Journey: Extraction

### 🎯 แนวคิดหลัก
Step แรกของ log pipeline คือการ "ดึง" log ออกจาก Kubernetes cluster อย่างมีประสิทธิภาพ

### Flow:
```
App Pod (stdout) → K8s Node (/var/log/containers/) → DaemonSet Agent (Fluent Bit)
```

### 📦 Application Pod
- App เขียน log ออก `stdout` / `stderr` เสมอ (Kubernetes best practice)
- Kubernetes runtime (containerd) redirect ไปเก็บที่ Node ในไฟล์ `/var/log/containers/<pod-name>_<namespace>_<container-name>-<container-id>.log`
- **ทำไมต้อง stdout?** เพราะ container ephemeral — ถ้าเขียนลง disk ของ container แล้ว container restart หรือ evict → log หาย

### 🖥️ Kubernetes Node
- Log ถูกเก็บที่ `/var/log/containers/` บน Node นั้น ๆ
- มี **Log Rotation** อัตโนมัติ (default: 10MB, 5 files) → ถ้า agent ดึงช้าเกินไป log จะถูก rotate ทิ้ง
- **สรุป**: ต้องมี agent ดึง log ออกอย่างต่อเนื่อง ไม่ใช่ดึงทีเดียวแบบ batch

### 🔄 DaemonSet (Fluent Bit / Fluentd / Promtail)
- **DaemonSet** = Kubernetes workload ที่รัน **1 Pod ต่อ 1 Node เสมอ** → ไม่มี Node ไหน miss log
- **เปรียบเทียบ Agent**:
  | Agent | ขนาด | ภาษา | เหมาะกับ |
  |-------|------|------|---------|
  | Fluent Bit | < 450KB RAM | C | K8s Production (แนะนำ) |
  | Fluentd | ~40MB RAM | Ruby | มี plugin ecosystem ใหญ่ |
  | Promtail | ~50MB RAM | Go | ใช้คู่ Grafana Loki |
- **Data Enrichment ฟรี**: Fluent Bit เพิ่ม K8s metadata เข้า log ทุก line อัตโนมัติ เช่น `namespace`, `pod_name`, `node_name`, `labels`

---

## Slide 5 — Log Journey: Processing & Storage

### 🎯 แนวคิดหลัก
หลังจากดึง log ออกจาก K8s แล้ว ต้องส่งผ่าน buffer และ processor ก่อนถึง storage

### Flow:
```
DaemonSet → Kafka/Pub/Sub → OTel Collector → Cloud Logging / S3
```

### 📨 Kafka / Pub/Sub (Message Broker)
**ทำไมต้องมี Buffer?**
- ถ้าส่งตรงจาก Agent → Storage แล้ว storage lag/ล่ม → Agent backpressure → App ช้า/crash
- Kafka รับ log แล้วเก็บใน disk ของตัวเอง consumer ค่อย pull ทีหลัง
- **Durability**: log อยู่ใน Kafka 7 วัน (configurable) → replay ได้ถ้า storage ล่ม
- **Fan-out**: Consumer groups หลายกลุ่มอ่าน topic เดียวกันพร้อมกันได้ (Elasticsearch + S3 + Datadog)

### 🔭 OpenTelemetry Collector
**ทำไมต้องมีก่อน S3?** (คำถามยอดนิยม)
1. **Filter & Scrub PII** — ลบ card number, password, token ก่อนเก็บ (PDPA/GDPR compliance)
2. **Fan-out** — ส่ง 1 stream ไปหลาย destination พร้อมกัน
3. **Format transformation** — แปลง JSON → Parquet สำหรับ Athena query
4. **Sampling** — เก็บแค่ 10% ของ success trace, เก็บ 100% ของ error trace (ลด cost)
5. **Vendor-agnostic** — เปลี่ยน backend โดยแก้แค่ config

**ถ้าไม่มี OTel แล้วส่งตรง S3:**
- เก็บ PII ใน S3 → ผิด PDPA
- เก็บ DEBUG log ทั้งหมด → cost พุ่ง
- เพิ่ม destination ต้องแก้ config Agent ทุก pod

### 🗄️ Cloud Logging / S3 (Storage)
- **Hot Storage** (Cloud Logging/Datadog): query เร็ว, real-time, แพง → เก็บ 7-30 วัน
- **Cold Storage** (S3/GCS): ราคาถูก ($0.023/GB/month), query ช้ากว่า → เก็บ 1-7 ปี (compliance)

---

## Slide 6 — Tracing Deep Dive

### 🎯 แนวคิดหลัก
Distributed Tracing ทำงานได้เพราะ **Context Propagation** — ทุก HTTP request พก header พิเศษที่บอกว่า "ฉันเป็นส่วนหนึ่งของ Trace อะไร"

### W3C Trace Context Header
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             ↑  ↑──────────── Trace ID ──────────────↑ ↑─Parent─↑ ↑flags
           version                                    Span ID
```
- **Trace ID**: unique ต่อ request ทั้งหมด (16 bytes hex)
- **Span ID**: unique ต่อ operation ย่อยแต่ละตัว (8 bytes hex)
- **SRE ต้องตรวจสอบ**: Nginx/Envoy/API Gateway ส่งต่อ header นี้ทุก hop ใช่มั้ย? ถ้าไม่ส่ง → trace chain หัก

### Auto vs Manual Instrumentation
| ประเภท | วิธี | เหมาะกับ |
|--------|------|---------|
| **Auto** | OTel SDK inject เอง ไม่ต้องแก้ code | Express, Spring Boot, FastAPI, Django |
| **Manual** | เขียน span เอง | Business logic, Background job, Legacy code |

### ตัวอย่าง Trace ใน Banking
```
Trace: txn-4bf9 (Mobile → Core Banking)
  ├── Span: API Gateway            12ms  ✅
  ├── Span: Auth Service            8ms  ✅
  └── Span: Core Banking DB      5001ms  ❌ TIMEOUT
```
→ เห็นทันทีว่า bottleneck อยู่ที่ DB ไม่ต้องเดา

---

## Slide 7 — Observability Ecosystem

### Open Source / CNCF
| Tool | บทบาท | ใช้เมื่อ |
|------|-------|---------|
| **Prometheus** | Metrics collection (Pull-based) | เก็บ time-series metric จาก K8s |
| **Grafana** | Visualization layer | ทำ dashboard จาก Prometheus/CloudWatch/Loki |
| **ELK Stack** | Log analytics | Elasticsearch (store) + Logstash (process) + Kibana (UI) |
| **EFK Stack** | Log analytics (lighter) | Elasticsearch + Fluent Bit/Fluentd + Kibana |
| **Jaeger** | Distributed Tracing backend | Open source trace backend |
| **Grafana Tempo** | Distributed Tracing backend | Loki-compatible, ราคาถูก |
| **Loki** | Log aggregation (Prometheus-style) | ไม่ index content, index แค่ label ถูกกว่า ES |

### เลือก Open Source เมื่อ:
- มี DevOps/Platform team ดูแล infra ได้
- ต้องการ data sovereignty (data ต้องอยู่ใน infrastructure ของตัวเอง)
- Log volume สูงมาก + budget จำกัด

---

## Slide 8 — Banking App Use Case

### 🎯 Scenario: Transfer Failed / Spinning Loader

**ขั้นตอนการ debug ด้วย Observability:**

1. **Metrics Alert**: Prometheus ตรวจพบ `transfer_failed_total` rate พุ่งเกิน 5% → alert ไป Discord
2. **SRE รับ alert**: คลิก link ใน Discord → เห็น Dashboard ว่า error เริ่มตอน 14:23
3. **Traces**: กดดู Trace ของ request ที่ fail → เห็น flame graph:
   ```
   API Gateway: 12ms ✅
   Auth Service:  8ms ✅
   Core Banking: 5001ms ❌ (Timeout)
   ```
4. **Logs**: ค้นหา Trace ID ใน Cloud Logging → เจอ log ของ DB:
   ```json
   {"level":"ERROR","query":"SELECT * FROM accounts WHERE user_id=?","duration":5001,"error":"connection_pool_exhausted"}
   ```
5. **Root Cause**: DB connection pool exhausted เพราะ slow query ไม่มี index บน `account_id`
6. **MTTR**: 4 นาที (เทียบกับ grep log แบบเดิม = หลายชั่วโมง)

---

## Slide 9 — Grafana & Alerting

### Grafana Dashboard
- Connect กับ Prometheus, CloudWatch, Datadog, BigQuery, OpenSearch ได้ทั้งหมด
- **Dashboard ที่ Banking App ควรมี**:
  - Transfer Success Rate (%) — real-time
  - P99 Latency per service
  - Active user sessions
  - DB connection pool utilization
  - Kafka consumer lag

### Alert Levels
| Level | เงื่อนไข | Action |
|-------|---------|--------|
| **P1 Critical** | error_rate > 5% หรือ service down | Page on-call ทันที (PagerDuty) |
| **P2 High** | error_rate > 1% หรือ latency P99 > 1s | Discord/Slack alert ใน 5 นาที |
| **P3 Warning** | trend ผิดปกติแต่ยังไม่ impact user | สร้าง Jira ticket อัตโนมัติ |

### Discord Integration
1. Discord → Edit Channel → Integrations → Webhooks → Create Webhook → Copy URL
2. Grafana → Alerting → Contact Points → New → Type: Discord → ใส่ URL
3. สร้าง Alert Rule → เลือก Contact Point → Save

**Alert message ที่ดีควรมี**: ชื่อ alert, ค่าปัจจุบัน, threshold ที่เกิน, link to dashboard, link to Runbook

---

## Slide 10 — Operational Excellence

### Alert Fatigue
**ปัญหา**: ถ้า alert มากเกินไปและไม่ actionable → SRE เริ่มเพิกเฉย alert ทั้งหมด
**แก้ด้วย**:
- Alert เฉพาะเมื่อ **SLI burning** (SLO กำลังถูกละเมิด)
- ลบ alert ที่ไม่เคยถูก action ออก (review ทุก sprint)
- ใช้ **Inhibition rules**: ถ้า infra ล่ม → silence alert ของ app ที่ depend บน infra นั้น
- ตั้ง **Dead Man's Switch**: alert ถ้า monitoring หายไปเอง (anti-silent-failure)

### Runbook / Playbook
**ทุก alert ต้องมี link ไปยัง Runbook** ที่มี:
1. ✅ Alert นี้หมายความว่าอะไร (context)
2. ✅ วิธีตรวจสอบว่าจริงหรือ false positive
3. ✅ Mitigation steps (ordered, numbered)
4. ✅ Escalation path ถ้า steps ข้างต้นไม่ work
5. ✅ Link to RCA template

### MTTR (Mean Time To Recovery)
```
MTTR = Detection time + Diagnosis time + Resolution time
```
- **ลด Detection**: Alert ที่ดี (SLI-based, ไม่ noisy)
- **ลด Diagnosis**: Traces + Logs correlation (เห็นทันที ไม่ต้อง grep)
- **ลด Resolution**: Runbook + automated rollback

> Industry benchmark P1: MTTR < 30 นาที

---

## Slide 11 — AWS CloudWatch Metrics

### Key Metrics ที่ควรรู้

**EC2 / ECS:**
- `CPUUtilization` — CPU usage (%)
- `NetworkIn/Out` — traffic volume
- `StatusCheckFailed` — instance health

**RDS:**
- `DatabaseConnections` — จำนวน connection ปัจจุบัน (alert ถ้า > 80% max_connections)
- `ReadLatency / WriteLatency` — I/O latency (alert ถ้า P99 > 100ms)
- `FreeStorageSpace` — disk space (alert ถ้า < 20%)

**Lambda:**
- `Duration` — execution time
- `Errors` — function errors
- `Throttles` — ถูก throttle เพราะ concurrency limit

**DynamoDB:**
- `ConsumedCapacity` — read/write units ที่ใช้
- `ThrottledRequests` — request ที่ถูก throttle (ต้อง 0 เสมอ)
- `SystemErrors` — DynamoDB internal errors

---

## Slide 12 — OpenSearch Log Search

### DSL Query พื้นฐาน
```json
GET logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        {"match": {"logLevel": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-10m"}}}
      ]
    }
  }
}
```

### Index Strategy
- **Time-based index**: `logs-2025.07.14` → ลบ old index ง่าย
- **ILM (Index Lifecycle Management)**:
  ```
  Hot (0-7d) → Warm (7-30d) → Cold (30-90d) → Delete
  ```
- **Data Stream**: สำหรับ time-series log — auto-manage index rollover

### OpenSearch vs Elasticsearch
| | OpenSearch | Elasticsearch |
|-|-----------|---------------|
| License | Apache 2.0 (free) | Elastic License (commercial for advanced) |
| Managed | Amazon OpenSearch Service | Elastic Cloud |
| ราคา | ถูกกว่า (AWS managed) | แพงกว่า |

---

## Slide 13 — Datadog APM Overview

### Key APM Metrics
- `trace.request.duration` — request latency per service
- `trace.error.rate` — error percentage
- `service.slo.burn_rate` — SLO health score

### Log Pipeline ใน Datadog
```
Agent → Intake API → Processing (Grok Parser) → Index / Archive / Metric
```
- **Log-based Metric**: นับ ERROR log เป็น metric `app.error.count` → ลด indexing cost
- **Archive**: ส่ง log ไป S3/GCS/Azure Blob พร้อมกับ index สำหรับ compliance
- **Sampling**: เก็บ ERROR 100%, INFO 10% (Flex Logs สำหรับ cold query)

---

## Slide 14 — Dynatrace AI-Driven Insights

### Davis AI — ทำงานอย่างไร?
1. **Adaptive Baseline**: เรียนรู้ "ค่าปกติ" ของทุก metric รวมถึง seasonal pattern (peak ช่วง 9-10 โมง)
2. **Anomaly Detection**: alert เมื่อ deviation ผิดจาก baseline โดยไม่ต้องตั้ง threshold เอง
3. **Impact Analysis**: ใช้ Smartscape topology หา blast radius
4. **Root Cause Correlation**: correlate anomaly กับ deployment event, config change, infra event

### OneAgent Advantages
- ติดตั้งครั้งเดียว ดัก code-level ได้เลย (JVM bytecode instrumentation)
- ไม่ต้องแก้ code app
- Auto-discover service และ dependency

---

## Slide 15 — Datadog Integration Points

### Integration ครอบคลุม 5 Layer:

1. **Infrastructure**: ดึง metric จาก AWS/GCP/Azure ผ่าน IAM Role ไม่ต้อง agent
2. **APM/Traces**: ddtrace auto-instrument หรือ OTel → Datadog Exporter
3. **Log Management**: รับจาก Agent, Fluent Bit, CloudWatch Lambda Forwarder, S3 Trigger, HTTP API
4. **RUM**: JS snippet วัด Core Web Vitals + session replay, Mobile SDK (iOS/Android)
5. **Synthetics**: API test ทุก 1 นาทีจากหลาย region, Browser test simulate user flow

> **Cost warning**: Log ingestion (รับเข้า) และ Log indexing (ค้นหาได้) คิดราคาแยกกัน — filter ก่อนส่งเสมอ

---

## Slide 16 — Dynatrace Integration Points

### 3 Component หลัก

**OneAgent** — agent ตัวเดียวดัก metric + trace + log + process
- ติดตั้งบน K8s ผ่าน Dynatrace Operator → DaemonSet อัตโนมัติ
- Auto-instrument: JVM, .NET CLR, Node.js, Python, PHP

**ActiveGate** — proxy/bridge สำหรับ environment ที่ OneAgent เข้าไม่ถึง
- ดึง AWS CloudWatch, GCP Cloud Monitoring, Azure Monitor
- รัน Synthetic test จาก private VPC
- Custom extension (Python) สำหรับ third-party API

**Grail Data Lakehouse** — storage engine แทน Elasticsearch
- Query ด้วย DQL (Dynatrace Query Language)
- Retention: Metrics 15 months, Traces 10 years, Logs 35 days default

---

## Slide 17 — Integration Architecture: Big Picture

### Full Stack Overview
```
Mobile/Web RUM → OTel Collector → Datadog/Dynatrace/OpenSearch/S3
                      ↑
K8s Fluent Bit → Kafka → OTel (filter/scrub/fan-out)
                      ↑
AWS CloudWatch → OTel (AWS receiver)
```

### Output จาก Monitoring Tools
| Output | ใช้ทำอะไร |
|--------|---------|
| **Dashboard** | Visualize metric + log สำหรับ SRE |
| **Alert → Discord/PagerDuty** | Notify on-call engineer |
| **Alert → Jira/ServiceNow** | Auto-create incident ticket |
| **Metrics API** | Export ไป Grafana/PowerBI |
| **SLO Report** | ส่ง business stakeholder |
| **Incident Timeline** | ใช้ทำ Post-Mortem / RCA |

---

## Slide 18 — Flow Comparison Overview

### เลือก Architecture อย่างไร?

| Flow | สถาปัตยกรรม | เหมาะเมื่อ |
|------|------------|----------|
| **A: Classic + OTel** | K8s → Fluent Bit → Kafka → OTel → Multi-dest | ต้องการ flexibility สูง, มี PII |
| **B: Direct OpenSearch** | K8s → Fluent Bit → Kafka → OpenSearch | Simple, destination เดียว, team เล็ก |
| **C: AWS Native** | CloudWatch → Kinesis Firehose → OpenSearch + S3 | All-in-AWS, ไม่ต้อง manage Kafka |
| **D: GCP Native** | Cloud Logging → Pub/Sub → BigQuery + GCS | All-in-GCP, ต้องการ SQL analytics |

> **Key Decision Factor**: ถ้าอนาคตอาจเปลี่ยน destination หรือต้องส่งหลายที่ → เลือก Flow A + OTel เสมอ

---

## Slide 19 — Flow B: Direct to OpenSearch (ไม่มี OTel)

### Architecture
```
App Pod (stdout)
  → K8s Node (/var/log/containers/)
    → Fluent Bit DaemonSet (+ K8s metadata enrichment)
      → Kafka (buffer, durability)
        → Logstash/Kafka Connect (parse + filter)
          → OpenSearch Cluster (HOT: 7-14 days)
            → OpenSearch Dashboards / Grafana
            → Alertmanager → Discord
          → S3 (COLD: backup, optional)
```

### ข้อดี
- Simple, mature pattern
- Latency ต่ำ (near real-time)
- ไม่ต้องเรียน OTel

### ข้อจำกัด
- เพิ่ม Datadog ทีหลัง = แก้ Fluent Bit config + restart
- ไม่มี PII scrubbing อัตโนมัติ (ต้องทำใน Logstash filter)
- OpenSearch cost สูงถ้า volume มาก → ใช้ ILM ย้าย log เก่าลง S3

### Index Lifecycle (ILM)
```
Hot   (0-7d)   : OpenSearch fast SSD
Warm  (7-30d)  : OpenSearch cheap storage
Cold  (30d+)   : S3 via Index State Management
Delete (90d+)  : auto-delete
```

---

## Slide 20 — Flow C: AWS Native (Kinesis Firehose)

### Architecture
```
ECS/EKS (awslogs driver) + Lambda (auto) + EC2 (CloudWatch Agent)
  → CloudWatch Logs (Log Groups)
    → Subscription Filter
      ├── Kinesis Data Firehose → OpenSearch Service (hot, 14d)
      │                         → S3 (cold archive)
      │                           → Athena SQL query
      ├── Lambda Forwarder (custom transform)
      └── Datadog Lambda Forwarder → Datadog
```

### AWS Services ที่ใช้
| Service | บทบาท | ราคา (approximate) |
|---------|-------|-------------------|
| CloudWatch Logs | Log ingestion + storage | $0.50/GB ingest, $0.03/GB store |
| Kinesis Firehose | Delivery stream (buffer) | $0.029/GB |
| OpenSearch Service | Hot log search | ~$0.12/hr per node |
| S3 | Cold archive | $0.023/GB/month |
| Athena | SQL query on S3 | $5/TB scanned |

### Firehose vs Kafka
| | Kinesis Firehose | Kafka (MSK) |
|-|----------------|-------------|
| Managed | ✅ Fully | ⚠️ Partially |
| Replay | ❌ ไม่รองรับ | ✅ replay ได้ |
| Fan-out | ⚠️ ต้อง Lambda | ✅ Consumer groups |
| ราคา | $0.029/GB | ~$0.21/hr/broker |
| **เลือกเมื่อ** | ส่งที่เดียว, ไม่ replay | ต้องการ replay + fan-out |

---

## Slide 21 — Flow D: GCP Native

### Architecture
```
GKE/Cloud Run/App Engine/Cloud Functions
  → Cloud Logging (auto-collected)
    → Log Router (Log Sink)
      ├── Sink A → BigQuery (analytics, SQL query, Looker Studio)
      ├── Sink B → GCS (cold archive, $0.02/GB/month)
      └── Sink C → Pub/Sub (streaming)
                    → OTel Collector
                      ├── OpenSearch (hot search, 7d)
                      └── Datadog (APM + Alerts)
```

### GCP Log Sink — ความสามารถพิเศษ
- **Inclusion Filter**: รับเฉพาะ log ที่ตรงเงื่อนไข เช่น `severity >= ERROR`
- **Exclusion Filter**: ลบ log ที่ไม่ต้องการออกก่อน sink
- **แต่ละ Sink filter อิสระ**: BigQuery รับแค่ ERROR, GCS รับทั้งหมด

### BigQuery Log Analytics
เมื่อ log อยู่ใน BigQuery สามารถ query ด้วย standard SQL:
```sql
-- Error rate per service ในช่วง 1 ชั่วโมง
SELECT
  JSON_VALUE(jsonPayload.service) AS service,
  COUNTIF(severity = 'ERROR') / COUNT(*) * 100 AS error_pct
FROM `project.prod_logs.k8s_container`
WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY service
ORDER BY error_pct DESC;
```
- **Looker Studio** connect BigQuery ได้โดยตรง → SLO report แบบ drag-and-drop
- **Cost**: $5/TB scanned (ถูกมากสำหรับ historical analysis)

---

## Slide 22 — Flow E: Datadog Full Integration

### Data Sources → Datadog

```
Mobile App    → Datadog RUM SDK (iOS/Android)
Web App       → Datadog RUM JS snippet
K8s Cluster   → Datadog Agent DaemonSet (Helm install)
AWS/GCP/Azure → Cloud Integration (IAM Role, API polling)
                     ↓
              Datadog Agent (Metrics + Logs + Traces)
                     ↓
              Datadog Intake API (HTTPS, app.datadoghq.com)
                     ↓
     ┌─────────┬─────────┬──────────┬───────────┐
     Metrics  Logs     APM/Trace   RUM      Synthetic
     Explorer Mgmt    (Service Map) Sessions   Tests
                     ↓
     Dashboards → Alert Rules → Discord / PagerDuty / Jira
                             → S3 Archive (Log compliance)
```

### Component ที่สำคัญ
| Component | ทำอะไร | Setup |
|-----------|--------|-------|
| **RUM SDK** | วัด Web Vitals, session replay, crash | 1 JS snippet ใน `<head>` |
| **DD Agent** | DaemonSet บน K8s วัด metric+log+trace | Helm chart 1 คำสั่ง |
| **ddtrace** | auto-instrument app ดัก trace | `require('dd-trace').init()` |
| **Cloud Integration** | ดึง CloudWatch metric ผ่าน IAM Role | ตั้ง Cross-account IAM |
| **Log Pipeline** | parse, route, index, archive log | Grok Parser + Exclusion Filter |
| **Synthetic** | API test ทุก 1 นาที จากหลาย region | ไม่ต้องติดตั้งอะไร |

---

## Slide 23 — Flow F: Dynatrace OneAgent Architecture

### Data Sources → Dynatrace

```
K8s Pods (Java/Node/Python/Go)
  → OneAgent DaemonSet (auto-instrument bytecode)
    → ActiveGate (proxy/extension)
      → Dynatrace SaaS (Grail Data Lakehouse)
        → Smartscape | Davis AI | Dashboard | Problems
          → Problem Card (auto RCA)
          → PagerDuty / Jira / Slack

AWS/GCP/Azure (Cloud)
  → ActiveGate (Cloud Integration Extension)
    → Dynatrace SaaS

Browser/Mobile (RUM)
  → Dynatrace JavaScript/Mobile SDK
    → Dynatrace SaaS (Digital Experience)
```

### Component ที่สำคัญ
| Component | บทบาท |
|-----------|-------|
| **OneAgent** | Agent หลัก auto-instrument ทุก technology โดยไม่แก้ code |
| **Dynatrace Operator** | K8s operator ที่ manage OneAgent DaemonSet lifecycle |
| **ActiveGate** | Proxy สำหรับ K8s Node → Dynatrace, ดึง Cloud metric |
| **Grail** | Storage engine (แทน Elasticsearch) query ด้วย DQL |
| **Smartscape** | Auto-generated topology map 5 layers |
| **Davis AI** | AI root cause analysis + adaptive baselining |

### DQL Query Example
```dql
fetch logs
| filter service.name == "transfer-service" and loglevel == "ERROR"
| filter timestamp > now() - 1h
| summarize count(), by: bin(timestamp, 5m)
```

---

## Slide 24 — Flow G: Splunk Universal Forwarder Architecture

### ทำไม Banking ถึงใช้ Splunk?
- **PCI-DSS Compliance**: ต้องการ audit log retention หลายปี และ immutable log
- **SIEM**: ตรวจจับ fraud, brute force, unusual transfer pattern
- **SOC (Security Operations Center)**: ทีม security ใช้ Splunk ES เป็น primary tool
- **Regulatory**: ธนาคารต้องส่ง log ให้ regulator ตรวจสอบได้

### Architecture
```
App Server/K8s Node → Universal Forwarder (UF) ─┐
Network Device (Firewall/Router) → Syslog (514)  ├→ Heavy Forwarder (HF)
AWS CloudTrail/VPC Logs → HEC (HTTPS:8088) ──────┘    (parse, filter, PII mask)
                                                           ↓
                                              Splunk Indexer Cluster
                                              (Hot🔴 → Warm🟡 → Cold🔵 → Frozen❄️→ S3)
                                                           ↓
                                              Splunk Search Head
                                              (SPL Query, Dashboards, Alerts)
                                                           ↓
                              ┌────────────────┬───────────┴──────────┐
                              ES (SIEM)     ITSI (IT Service)    SOAR (Automation)
```

### Splunk Components
| Component | บทบาท |
|-----------|-------|
| **Universal Forwarder** | Agent เบา (< 20MB) ส่ง raw log ไม่ parse เอง |
| **Heavy Forwarder** | Parse, filter, route, mask PII ก่อนส่ง indexer |
| **HTTP Event Collector** | รับ event จาก app/Lambda โดยตรง ไม่ต้องติดตั้ง UF |
| **Indexer Cluster** | เก็บ log จัดการ hot/warm/cold bucket lifecycle |
| **Search Head** | Query SPL, Dashboard, Alert, Saved Search |
| **Enterprise Security** | SIEM correlation rule, fraud detection |
| **SOAR** | รัน automated playbook เมื่อ alert เกิด |

### SPL ภาษา Query ของ Splunk
```splunk
index=prod_app_logs sourcetype="banking:transfer" earliest=-1h
| stats count AS total, count(eval(status="failed")) AS errors BY service
| eval error_pct = round(errors/total*100, 2)
| where error_pct > 1
| sort -error_pct
```

### Splunk Bucket Lifecycle
| Phase | ระยะเวลา | Storage | Access |
|-------|---------|---------|--------|
| **Hot** 🔴 | 0-7 วัน | SSD (เร็ว) | Read + Write |
| **Warm** 🟡 | 7-30 วัน | HDD | Read only |
| **Cold** 🔵 | 30-90 วัน | Cheap HDD/NAS | Read only |
| **Frozen** ❄️ | 90+ วัน | S3 SmartStore | Pull on demand |

---

## 🔍 Summary: เลือก Tool อย่างไร?

```
ต้องการ SIEM / Security-first?
  → Splunk Enterprise Security

All-in-AWS และอยากใช้ managed service?
  → CloudWatch + Kinesis Firehose + OpenSearch Service

All-in-GCP และต้องการ SQL analytics?
  → Cloud Logging → BigQuery + Looker Studio

ต้องการ AI Root Cause Analysis อัตโนมัติ?
  → Dynatrace + Davis AI

ต้องการ All-in-One (APM + Log + Metric + RUM + Synthetic)?
  → Datadog

มี DevOps team, budget จำกัด, data sovereignty?
  → Prometheus + Grafana + EFK + Jaeger (Open Source)

ต้องการ vendor-agnostic pipeline ที่เปลี่ยน backend ได้?
  → OpenTelemetry Collector เป็น core
```

---

## 📌 Glossary

| คำ | ความหมาย |
|----|---------|
| **SRE** | Site Reliability Engineering — วิศวกรรมด้านความน่าเชื่อถือของระบบ |
| **SLO** | Service Level Objective — เป้าหมายระดับการให้บริการ เช่น P99 < 500ms |
| **SLA** | Service Level Agreement — ข้อตกลงกับลูกค้า ถ้าผิดมีค่าปรับ |
| **SLI** | Service Level Indicator — metric ที่วัดเพื่อประเมิน SLO |
| **MTTR** | Mean Time To Recovery — เวลาเฉลี่ยในการกู้คืนระบบหลังเกิดเหตุ |
| **MTTD** | Mean Time To Detect — เวลาเฉลี่ยในการตรวจพบปัญหา |
| **RCA** | Root Cause Analysis — การวิเคราะห์หาสาเหตุที่แท้จริง |
| **DaemonSet** | Kubernetes workload ที่รัน 1 Pod ต่อ 1 Node เสมอ |
| **OTel** | OpenTelemetry — open standard สำหรับ observability |
| **HEC** | HTTP Event Collector — Splunk API รับ event ผ่าน HTTPS |
| **SPL** | Search Processing Language — ภาษา query ของ Splunk |
| **DQL** | Dynatrace Query Language — ภาษา query ของ Dynatrace Grail |
| **PII** | Personally Identifiable Information — ข้อมูลส่วนบุคคล |
| **PDPA** | Personal Data Protection Act — พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (ไทย) |
| **GDPR** | General Data Protection Regulation — กฎหมายคุ้มครองข้อมูล EU |
| **SIEM** | Security Information and Event Management |
| **SOAR** | Security Orchestration Automation and Response |
| **ILM** | Index Lifecycle Management — จัดการ lifecycle ของ index ใน Elasticsearch/OpenSearch |
| **Fan-out** | ส่ง 1 stream ไปหลาย destination พร้อมกัน |

---

*เอกสารนี้ generate จาก presentation ณ วันที่ 14 กรกฎาคม 2568*  
*Maintainer: J7X_DD*
