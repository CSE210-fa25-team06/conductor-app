# Sprint 2 Planning (Nov 15th - Nov 21)  
**Time:** 3:45pm - 4:00pm  
**Scriber:** Alex  
**Attendance:** Melvyn, Isheta, Tej, Akshay, Jared, Alex, Tongke, Patryk, Lei Hu, Siri  

---

## Feature 1 – User Authentication
1. Support different user roles: **Instructor/TA, Team Lead, Tutor, and Student**, each with their own views  
2. **Encrypt** Google account data  
3. Add **logging and auditing** for login attempts  

---

## Feature 2 – Class Directory
1. Add **filtering options** by role (**Alex**)  
2. Improve **table layout** for mobile-friendly screens and better readability (**Adam**)  
3. Display **attendance statistics** over a time period (quarter, month, week?) (**Melvyn**)  

---

## Feature 3 – Attendance
1. Implement **QR Code attendance** (team lead submission + individual QR scan) (**Tej**)  
2. Display **real-time attendance status** for each student (**Melvyn**)  
3. Update **table layout** for responsive design  

---

## Feature 4 – Journal
1. Add **edit** and **delete** options for stand-up entries (**Melvyn**)  
2. Include an **emotional sentiment indicator** (happy / neutral / sad face with optional comments) (**Tongke & Lei Hu**)  
3. Improve **table layout** for responsive design (**Tongke & Lei Hu**)  
4. Add **date** and **thoughts for today** fields for journal entries (**Tongke & Lei Hu**)  

---

## Misc Tasks
1. Integrate **unit tests** into the CI/CD pipeline, including Postgres database testing (**Patryk?**)  
2. Set up **Docker** for local development and deployment consistency (**Patryk**)  
3. Enforce **accessibility** standards across the frontend  
4. Add **integration** and **end-to-end testing** for Sprint 2 (**Akshay**)  
5. Implement **dashboards** for data visualization (**Isheta**)  

---

## Questions
**Q:** Patryk asked how to test Postgres using GitHub Actions  
**A:** Spin up a **Postgres container**, run **schema** and **seed scripts**, then execute **Jest tests**.  
Jared has previously tested this (see **Issue #47**) for reference.  
