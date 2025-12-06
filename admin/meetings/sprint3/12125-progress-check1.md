# Meeting 12/1/2025  
**Time:** 3:00pm - 3:30pm  
**Scriber:** Austin  
**Attendance:** Isheta, Melvyn, Austin, Tej, Akshay, Siri, Tongke, Jared, Lei Hu  

---

## Agenda

### 1. Progress Updates from Each Team

#### **User Authentication**
- **Siri:** Created profile page.  
  - Question raised: Do we need “availability”? Might be removed.  
- **Austin:** Implemented whitelist for UCSD login only.  
  - If time permits, will create functionality to provision users from CSV upload.  
  - Supporting both frontend and backend merging.  

---

#### **Class Directory**
- **Melvyn:** Added attendance table to the class directory.  
  - Attendance is calculated by the number of “Present” occurrences in lectures.  
  - Planning to remove permission checks from the directory.  

---

#### **Attendance**
- **Jared:** Working on QR framework for attendance; collaborating with Tej.  
  - Goal: Complete feature by the end of the week.  
- **Tej:** Working on authentication integration with testing.  
  - Updating conflict files and responding to PR comments.  
  - Will start writing tests tomorrow.  

---

#### **Journal**
- **Lei Hu:** Working on connecting backend for emotion sentiment tracker.  
  - Each journal entry will include a sentiment score.  

---

#### **Misc**
- **Patryk:** Encrypting Google account data.  
- **Tongke:** Completed frontend for UI permissions.  
- **Alex:** Developing backend for UI permissions.  
- **Adam:** Writing Swagger documentation.  
- **Akshay:** Completed Playwright tests.  
  - All tests run sequentially and validate core functionality.  
  - These are expensive tests and should only run on the **main branch**.  
  - Must manage GitHub Actions minutes and raw data storage carefully.  

---

### **General Notes**
- **Code freeze:** December 10th — aim to complete all work by **end of this week**.  
- TA mentioned: **Deployed application** required by end of week.  
- Midterm happening this week — review assigned topics (Google search allowed, but no direct lookup).  
- Discussed handling **500–1000 concurrent users** - may assign to **Adam**; Isheta will confirm with TA.  
- Everyone should assist others with their tasks when possible.  
- Application already satisfies **internationalization** requirements.  
- **Sprint extended until Friday.**  

---

### 2. Tasks Left To Do

#### **Feature 1 – User Authentication**
1. Backend UI for setting permissions and assigning groups/roles (**Alex**)  
2. Profile and Settings (**Siri**)  

#### **Feature 2 – Class Directory**
1. Update attendance statistics after attendance DB finalization (**Melvyn**)  

#### **Feature 3 – Attendance**
1. Implement frontend for QR Code attendance and connect both parts (team lead submission + individual QR scan) (**Jared & Tej**)  
2. Display real-time attendance status for **Professor view** (**Melvyn**)  

#### **Feature 4 – Journal**
1. Backend for emotional tracker (**Lei Hu**)  
2. Add emotional sentiment indicator as a **dashboard widget** (**Melvyn**)  

#### **Misc Tasks**
1. Open Telemetry (**Patryk**)  
2. Student + Professor dashboard views for user roles (**Isheta**)  
3. Mobile-friendly design (TBD)  
4. PostgreSQL optimizations (**Adam**)  
5. Unit tests for attendance (**Akshay**)  
