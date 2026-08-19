# Requirements QA Alignment: tarot-fortune

## Gate Status

- Status: Approved
- Reviewer Notes: Flow, validation, API payload, UI states, and negative cases are observable and testable. User decisions are recorded in the analyst overview.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | แสดงสำรับไพ่ 78 ใบชื่อภาษาไทยไม่ซ้ำ | Good | None | None |
| FR-002 | สับลำดับสำรับเมื่อเริ่มรายการใหม่ | Good | None | None |
| FR-003 | เลือกไพ่ครบ 10 ใบและไม่เกิน 10 ใบ | Good | None | None |
| FR-004 | ส่งชื่อไพ่ที่เลือกไปยัง API | Good | Field contract defined as `tarotCards` | None |
| FR-005 | AI วิเคราะห์จากไพ่ที่เลือก | Good | Observable in gateway prompt contract | None |
| NFR-001 | คง loading/error behavior ของ fortune เดิม | Good | None | None |
| EC-001 | ปฏิเสธจำนวนไพ่ไม่ครบ 10, ซ้ำ, หรืออยู่นอกสำรับ | Good | None | None |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Given หน้าเริ่มรายการ When โหลดแบบฟอร์มหรือกดเริ่มใหม่ Then แสดงไพ่ 78 ใบชื่อไทยไม่ซ้ำ |
| AC-002 | Analyst | Given เริ่มรายการใหม่ When สำรับถูกสร้าง Then ลำดับสำรับถูกสับใหม่ |
| AC-003 | Analyst | Given สำรับแสดงอยู่ When เลือกไพ่ Then จำนวนเลือกเพิ่มได้ถึง 10 และเลือกใบที่ 11 ไม่ได้ |
| AC-004 | Analyst | Given เลือกน้อยกว่า 10 ใบ When submit Then ไม่เรียก onSubmit และแสดง validation error |
| AC-005 | Analyst | Given เลือกครบ 10 ใบ When submit Then ส่ง `tarotCards` เป็นชื่อไทย 10 ชื่อไม่ซ้ำ |
| AC-006 | Analyst | Given request ผิดรูปแบบ When API normalize Then ตอบ validation failure สำหรับจำนวน/ชื่อซ้ำ/ชื่อไม่รู้จัก |
| AC-007 | Analyst | Given request ถูกต้อง When API สร้าง gateway payload Then user prompt ระบุให้วิเคราะห์ไพ่ทาโรต์และมีชื่อไพ่ที่เลือก |
| AC-008 | Analyst | Given API stream สำเร็จ/ล้มเหลว When client แสดงผล Then แสดงชื่อไพ่และคง loading/error behavior |

## Pasted Test Cases

| Test Case ID | Source | Scenario | Steps | Expected Result | Type | Priority | Parse Quality |
|--------------|--------|----------|-------|-----------------|------|----------|---------------|
| - | - | ไม่มี test cases จากผู้ใช้ | - | - | - | - | - |

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
|-------|------------------------------|-----------------------|----------|-------|
| AC-001 | สำรับ 78 ใบ ชื่อไม่ซ้ำ | TC-001 | Covered | Unit test data invariant + form render |
| AC-002 | สับใหม่เมื่อเริ่มรายการ | TC-002 | Covered | Test shuffle produces valid permutation and new reading resets deck |
| AC-003 | เลือก 10 และห้ามใบที่ 11 | TC-003 | Covered | Component interaction test |
| AC-004 | ห้าม submit ก่อนครบ 10 | TC-004 | Covered | Component validation test |
| AC-005 | ส่งชื่อไทย 10 ใบ | TC-005 | Covered | Form submit + request normalization |
| AC-006 | API validation | TC-006 | Covered | Request unit test |
| AC-007 | Prompt มีคำสั่งและชื่อไพ่ | TC-007 | Covered | Prompt unit test |
| AC-008 | ผลลัพธ์/loading/error | TC-008 | Partial | Existing route/stream tests cover API; result display test should be added if practical |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-001 | AC-001 | TC-001 | Unit | High | Covered |
| FR-002 | AC-002 | TC-002 | Unit | Medium | Covered |
| FR-003 | AC-003/004 | TC-003/004 | Component | High | Covered |
| FR-004 | AC-005/006 | TC-005/006 | Unit/API | High | Covered |
| FR-005 | AC-007 | TC-007 | Unit | High | Covered |
| NFR-001 | AC-008 | TC-008 | Component/API | Medium | Partial |
| EC-001 | AC-006 | TC-006 | Unit/API | High | Covered |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Deck invariant | Load tarot data | Exactly 78 unique Thai names exist | Unit | High |
| TC-002 | Shuffle | Create two new reading decks | Each is a valid permutation; new-reading path requests shuffle | Unit | Medium |
| TC-003 | Ten-card cap | Select 10 then click an unselected 11th card | Selection remains 10 and 11th is not selected | Component | High |
| TC-004 | Incomplete selection | Fill required identity fields and select 9 cards, submit | Validation error; onSubmit not called | Component | High |
| TC-005 | Payload | Select 10 unique cards and submit | onSubmit receives `tarotCards` with those 10 Thai names | Component | High |
| TC-006 | Malformed API input | Send 9, 11, duplicate, and unknown cards | Normalizer rejects each invalid request | Unit | High |
| TC-007 | Tarot prompt | Build prompt with 10 selected names | Prompt instructs tarot reading and includes all names | Unit | High |
| TC-008 | Result states | Render result loading, success, and error states | Selected cards and state-specific UI are visible | Component | Medium |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | Submit with fewer than 10 cards | Client blocks submit with Thai validation message | TC-004 |
| EC-002 | Attempt 11th selection | Client ignores selection and keeps 10 | TC-003 |
| EC-003 | Duplicate names in request | API rejects request | TC-006 |
| EC-004 | Unknown/forged card name | API rejects request | TC-006 |
| EC-005 | Gateway timeout/empty stream | Existing error/empty response handling remains | TC-008 |

## Open Questions

- None blocking implementation. ไพ่กลับหัวและ persistence ถูกยืนยันเป็น out of scope.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
