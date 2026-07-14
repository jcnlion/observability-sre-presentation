# 📖 SRE Observability Project Glossary (CONTEXT.md)

> เอกสารนี้เป็นพจนานุกรมกลาง (Ubiquitous Language) เพื่อสรุปนิยามคำศัพท์และองค์ประกอบสถาปัตยกรรมที่ใช้ในการออกแบบระบบ Observability ของโครงการนี้ เพื่อให้ทีมวิศวกรผู้พัฒนาและทีมงาน SRE เข้าใจตรงกัน

---

## 📐 Core SRE Concepts

### SLI (Service Level Indicator)
* **นิยาม**: ตัวชี้วัดระดับการให้บริการจริง ณ ช่วงเวลานั้นๆ
* **ลักษณะการใช้งาน**: ต้องวัดผลจากมุมมองของผู้ใช้งานจริง (User Perspective) และคำนวณเป็นร้อยละ (Percentage) เสมอ เช่น อัตราความสำเร็จของคำขอ (`successful_requests / total_requests * 100`)

### SLO (Service Level Objective)
* **นิยาม**: เป้าหมายระดับคุณภาพบริการที่เราคาดหวังให้เป็นตาม SLI ภายในช่วงเวลาที่กำหนด
* **ลักษณะการใช้งาน**: ประกอบด้วยค่าเป้าหมาย (Target) และขอบเขตเวลา (Time Window) เช่น `Transfer Success Rate ≥ 99.9% rolling 30 days`

### SLA (Service Level Agreement)
* **นิยาม**: ข้อตกลงระดับบริการที่เป็นสัญญาระหว่างผู้ให้บริการกับผู้ใช้บริการ ซึ่งหากฝ่าฝืนจะมีผลทางกฎหมายหรือมีค่าปรับ
* **ลักษณะการใช้งาน**: โดยปกติจะผ่อนปรนกว่า SLO เพื่อให้ทีมงานภายในมี Buffer ก่อนที่ผู้ใช้จะได้รับผลกระทบ (เช่น SLO = 99.9%, SLA = 99.5%)

### Error Budget
* **นิยาม**: งบประมาณหรือโควต้าของความผิดพลาดที่ระบบสามารถยอมรับได้
* **ลักษณะการใช้งาน**: คำนวณจาก `100% - SLO Target` (เช่น SLO 99.9% จะมี Error Budget 0.1% หรือคิดเป็นเวลา Downtime ~43 นาทีต่อ 30 วัน) ใช้เป็นเกณฑ์ในการตัดสินใจเรื่องการ Deploy ฟีเจอร์ใหม่

### Burn Rate
* **นิยาม**: อัตราความเร็วในการเผาผลาญ Error Budget
* **ลักษณะการใช้งาน**: ใช้ตั้ง Alert แบบชาญฉลาด (Multi-window Multi-threshold Alerting) เพื่อแจ้งเตือนเฉพาะเมื่อพบว่าแนวโน้มความเสียหายจะส่งผลให้ Error Budget หมดลงเร็วกว่าปกติ

### MTTR (Mean Time To Recovery)
* **นิยาม**: ระยะเวลาเฉลี่ยในการกู้คืนระบบกลับมาใช้งานได้ตามปกติหลังเกิดปัญหา (โดยเป้าหมายหลักคือหยุดยั้งไม่ให้ผู้ใช้งานได้รับผลกระทบ)

---

## 🗂️ Logs Architecture & Buffering

### Universal Forwarder (UF)
* **นิยาม**: Agent ส่ง Log ขนาดเล็กและใช้ทรัพยากรน้อยของ Splunk
* **ลักษณะการใช้งาน**: ติดตั้งเป็น DaemonSet หรือ Service บนโฮสต์เพื่อทำหน้าที่อ่านไฟล์ Log ดิบ แล้วส่งต่อทันทีโดยไม่มีการ Parse ข้อมูล

### Heavy Forwarder (HF)
* **นิยาม**: Node จัดการและกรองข้อมูลขั้นสูงของ Splunk
* **ลักษณะการใช้งาน**: ทำหน้าที่รับข้อมูลจาก Universal Forwarder เพื่อนำมา Parse, ทำโครงสร้าง (Parsing), กรองเอาข้อความขยะออก หรือปิดบังข้อมูลส่วนบุคคล (PII Masking) ก่อนส่งไปเก็บจริงที่ Indexer

### HTTP Event Collector (HEC)
* **นิยาม**: Endpoint API ของ Splunk ที่เปิดให้ส่งข้อมูลผ่าน HTTP/HTTPS
* **ลักษณะการใช้งาน**: มักใช้ควบคู่กับ Cloud Functions/AWS Lambda หรือฝังลงในโค้ดแอปพลิเคชันเพื่อ Push log ตรงเข้า Splunk โดยตรงโดยไม่ต้องมี Forwarder Agent

### OpenTelemetry (OTel) Collector
* **นิยาม**: ตัวประมวลผลข้อมูลกลางที่เป็น Open Standard
* **ลักษณะการใช้งาน**: ทำหน้าที่รับ ประมวลผล และส่งออกข้อมูลทั้ง 3 Pillars (Metrics, Logs, Traces) รองรับการทำ Filtering, Sampling และ PII Scrubbing ทำให้สถาปัตยกรรมหลุดพ้นจากการยึดติดกับ Vendor รายใดรายหนึ่ง (Vendor-agnostic)

### Index Lifecycle Management (ILM)
* **นิยาม**: กระบวนการควบคุมการย้ายข้อมูลและลบข้อมูล Log ตามอายุโดยอัตโนมัติ
* **ลักษณะการใช้งาน**: แบ่งช่วงจัดเก็บเป็น Hot Tier (ดิสก์เร็ว ค้นหาไว) -> Warm Tier -> Cold Tier (Object Storage) -> Frozen Tier (Archive) เพื่อลดต้นทุนจัดเก็บ

---

## 🧠 Enterprise Observability Tools

### Smartscape
* **นิยาม**: เทคโนโลยีการสร้างแผนผังความสัมพันธ์ (Topology Map) อัตโนมัติในทุกเลเยอร์ของ Dynatrace (Geo -> Host -> Process -> Service -> App)
* **ลักษณะการใช้งาน**: ใช้ประเมินขอบเขตผลกระทบ (Blast Radius) ของปัญหาได้อย่างรวดเร็ว

### Davis AI
* **นิยาม**: ปัญญาประดิษฐ์ (AI Engine) ของ Dynatrace
* **ลักษณะการใช้งาน**: ทำหน้าที่วิเคราะห์ความผิดปกติโดยเปรียบเทียบกับ Baseline อัตโนมัติ และค้นหาสาเหตุที่แท้จริงของปัญหา (Root Cause Analysis - RCA) โดยอ้างอิงข้อมูลความสัมพันธ์จาก Smartscape

### ActiveGate
* **นิยาม**: Gateway/Proxy ของ Dynatrace
* **ลักษณะการใช้งาน**: ทำหน้าที่เป็นด่านหน้าคอยดักดึงข้อมูลคลาวด์ API, รัน Synthetic Test ในระบบเน็ตเวิร์กปิด และรับข้อมูลจาก OneAgent ในเขตเน็ตเวิร์กส่วนตัวเพื่อส่งออกไปยัง Dynatrace SaaS

### Grail
* **นิยาม**: Storage Engine และ Data Lakehouse เทคโนโลยีเฉพาะของ Dynatrace
* **ลักษณะการใช้งาน**: ออกแบบมาเพื่อเก็บและวิเคราะห์ Metrics, Logs, และ Traces รวมกันในที่เดียวโดยไม่ต้องทำ Schema หรือทำ Index ล่วงหน้า

### Dynatrace Query Language (DQL)
* **นิยาม**: ภาษาที่ใช้สืบค้นข้อมูลของ Dynatrace Grail

### Search Processing Language (SPL)
* **นิยาม**: ภาษาหลักในการใช้ฟิลเตอร์ ค้นหา และวิเคราะห์ข้อมูลบน Splunk
