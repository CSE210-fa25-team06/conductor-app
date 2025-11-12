# Architecture Decision Record (ADR) Hosting and Deployment Choices

**ADR #:** 4  
**Title:** Hosting and Deployment Choice  
**Date:** 2025-11-09  
**Status:** [Proposed | Accepted | Rejected | Superseded by ADR-XXX]

---

## 1. Context
The Conductor application needs a reliable and simple deployment process that can be reproduced by future course staff without deep technical knowledge. The hosting solution should be lightweight, low-cost, and easy to set up locally or on institutional infrastructure.  

Since the app is designed for academic use, each instructor or teaching team must be able to deploy and maintain their instance with minimal dependencies or configuration. The system should also be easy to test, run locally, and deploy across different environments (Windows, macOS, Linux).  

Key constraints include:

- Must be easy for instructors and TAs to deploy each quarter.  
- No reliance on complex or difficult to deloy cloud infrastructure.  
- Should maintain portability and consistent behavior across all developer setups.  
- Should allow database backups and restore for long-term data reliability.  

---

## 2. Decision
The Conductor app will use a lightweight local hosting and deployment setup built around Docker containers for consistency and portability.  

Each team member and instructor will be able to run the system locally using simple commands without the need to configure external servers or manage complex networking.  

Deployment will rely on local instances, lightweight servers (such as university-provided VMs or classroom machines), or Digital Ocean as suggested in the [spec](https://tpowell.craft.me/xXuZoY59NY9R36).

Environment variables will be managed through `.env` files that define database credentials, authentication secrets, and runtime settings.

---

## 3. Alternatives Considered
- **Option 1:** AWS EC2 Hosting  
AWS provides scalability and reliability but introduces unnecessary complexity and potential costs. Instructors would need to set up security groups, SSH keys, and network configurations. This is not ideal for the goal of simplicity and fast deployment.  

- **Option 2:** Heroku or Render  
Platforms like Heroku or Render simplify deployment but introduce external dependencies and potential usage fees. They also have limited free tiers and may change pricing or feature availability in the future.  

- **Option 3:** On-Premise Hosting without Containers  
Manual installation of Node.js, PostgreSQL, and dependencies on each machine would make environment setup inconsistent and error-prone. Docker makes sure uniformity is possible across all setups.  

---

## 4. Consequences
**Positive Outcomes**
- Simple and reproducible setup process for all team members and instructors.  
- Consistent environment across development, testing, and deployment.  
- No reliance on external cloud providers or paid services.  

**Negative Outcomes**
- Limited scalability compared to managed cloud infrastructure.  
- Requires users to have Docker installed locally.  
- No built-in monitoring or automatic scaling for heavy usage.  

**Impact on Other Systems**
- The database (PostgreSQL) will run inside a Docker container and can be backed up via volume exports.  
- Continuous integration (GitHub Actions) will verify builds and linting before deployment.  
- The deployment process will support rollback to the last stable image in case of errors.  

---

## 5. Implementation Notes
- Use Docker Compose to define containers for the backend, database, and testing environments.  
- Store sensitive credentials in a `.env` file excluded from version control.  
- Build and test containers through GitHub Actions before merging changes to `main`.  
- Provide a step-by-step setup guide in `README.md` for instructors to deploy locally.  
- When possible, host static files (HTML, CSS, JS) on UCSD-provided web servers for public access.  

---

## 6. References
- [Design doc link](https://github.com/CSE210-fa25-team06/conductor-app/blob/main/specs/pitch/design-spec.pdf)  
- [Docker Documentation](https://docs.docker.com/get-started/)  
- [Docker Compose Reference](https://docs.docker.com/compose/)  
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)  
- [ADR-1: Overall System Architecture](adr.md)
