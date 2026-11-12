/**
 * Every fact on this site comes from Bernie's resume (October 2026) or was confirmed by Bernie. Nothing here is estimated or invented.
 * To add details (team size, site counts, results), edit this file only.
 */
export const profile = {
  name: "Bernie Brice",
  initials: "BB",
  title: "Senior IT Infrastructure Engineer",
  location: "New York, NY",
  email: "bricebernie@gmail.com",
  linkedin: "https://www.linkedin.com/in/bernie-brice-82491098",
  resumePdf: "/Bernie-Brice-Resume.pdf",
  headshot: "/headshot.jpg",
  status: "CompTIA Security+ certified",
  pitch: "I keep multisite networks, identity and infrastructure running, and I automate the work around them.",
  summary:
    "IT Infrastructure Engineer with 7+ years supporting enterprise technology across healthcare, banking and hospitality. I serve as the primary internal onsite IT resource for a multisite healthcare organization: SonicWall firewalls, site-to-site VPNs, UniFi/Cisco switching, Ubiquiti wireless, VLAN segmentation, branch relocations, vendor escalations and critical incident response.",
  availability: "Onsite, hybrid or remote",
  current: { title: "Senior IT Infrastructure Engineer", org: "Marks Home Care Agency" },
  about:
    "I'm a Senior IT Infrastructure Engineer in New York. For 7+ years I've kept the technology behind healthcare, banking, hospitality and data center teams running, from racking and patching branch networks to securing Active Directory and closing escalations fast. Today I'm the internal infrastructure owner for a multi-branch healthcare organization. Outside work, I run a home lab where I test automation, backups and clustering.",
};

export interface Metric { value: string; label: string; source: string; study: string }
export const metrics: Metric[] = [
  { value: "95%", label: "fewer unauthorized access incidents across 300+ Active Directory users", source: "The Mark Hotel", study: "active-directory-security" },
  { value: "500", label: "users moved from legacy PBX to NEC VoIP at 99.99% call availability", source: "The Mark Hotel", study: "pbx-to-voip" },
  { value: "92%", label: "of L3 escalations closed within 3 hours, lifting productivity 20%", source: "Santander Bank", study: "l3-escalations" },
  { value: "25%", label: "fewer network outages after packet analysis", source: "Penn Medicine", study: "network-reliability" },
];

export interface Job { org: string; title: string; location: string; dates: string; bullets: string[]; studies: string[] }
export const jobs: Job[] = [
  {
    org: "Marks Home Care Agency", title: "Senior IT Infrastructure Engineer", location: "Brooklyn, NY", dates: "Mar 2024 – Present", studies: ["multisite-healthcare-network", "branch-relocations"],
    bullets: [
      "Primary internal IT infrastructure owner across multiple healthcare branch locations: network reliability, hardware lifecycle management, onsite escalation and business continuity",
      "Configure, troubleshoot and support routers, switches, core switch uplinks, wireless access points, firewalls, SonicWall site-to-site VPN tunnels, VLAN segmentation and site connectivity",
      "Lead onsite infrastructure execution for branch moves, office buildouts and relocations: network readiness, hardware transport, workstation setup, printer/scanner deployment and post-move support",
      "Provide critical onsite support for the company's third-party MSP: physical infrastructure issues, escalation response, site-specific troubleshooting and technical documentation that remote helpdesk teams cannot complete",
      "Provision and standardize endpoints and office hardware (desktops, laptops, monitors, docks, printers, scanners, networking equipment) and complete new-hire technology setups",
      "Created and maintain IT equipment layouts, site blueprints and branch documentation that improve asset visibility, reduce troubleshooting time and streamline planning",
      "Sole internal onsite IT resource for network outages, urgent hardware failures, branch leadership requests and time-sensitive infrastructure issues",
    ],
  },
  {
    org: "The Mark Hotel", title: "System Analyst", location: "Manhattan, NY", dates: "Nov 2023 – Apr 2024", studies: ["pbx-to-voip", "active-directory-security"],
    bullets: [
      "Enforced Active Directory security policies for 300+ users; cut unauthorized access incidents 95%",
      "Migrated 500 users from legacy PBX to NEC VoIP; achieved 99.99% call availability post-transition",
      "Maintained a Windows Server environment (10+ physical, 20+ virtual machines) for stability and uptime",
      "Produced migration plans with risk assessments and dependency mapping for 50+ business-critical applications",
      "Managed Microsoft 365 license assignments and user access for SharePoint, Exchange Online and Teams",
    ],
  },
  {
    org: "Santander Bank", title: "Senior IT Support Specialist", location: "Holmdel, NJ", dates: "Oct 2022 – Oct 2023", studies: ["l3-escalations"],
    bullets: [
      "Closed 92% of L3 escalations within 3 hours, improving productivity 20%",
      "Administered TCP/IP networks supporting 300+ users; increased performance 10%",
      "Trained new hires on SharePoint and Active Directory; achieved a 95% satisfaction score",
    ],
  },
  {
    org: "Penn Medicine University Hospital", title: "Senior IT Support Specialist", location: "Princeton, NJ", dates: "Mar 2021 – Sep 2022", studies: ["network-reliability"],
    bullets: [
      "Used packet analysis to identify bottlenecks; lowered network outages 25%",
      "Operated ServiceNow ITSM for 5,000+ users; managed patches and upgrades to minimize business impact",
      "Troubleshot DNS/DHCP/IP issues; decreased monthly downtime incidents 25%",
    ],
  },
  {
    org: "ZT Systems Data Center", title: "Computer Server Technician / Tester", location: "Hudson County, NJ", dates: "Feb 2019 – Feb 2021", studies: ["server-validation"],
    bullets: [
      "Troubleshot, tested and validated multiple enterprise server systems daily: hardware diagnostics, failure isolation and production readiness",
      "Configured and supported server builds for major cloud and enterprise environments, including Amazon and Microsoft server hardware platforms",
      "Executed hardware and software test procedures, documented failures and assisted engineering teams with root-cause analysis",
      "Built and prepared server systems from physical assembly through network cabling, component validation and readiness testing",
    ],
  },
  {
    org: "Rutgers University", title: "Help Desk", location: "Piscataway, NJ", dates: "Mar 2018 – Oct 2018", studies: [],
    bullets: [
      "First point of contact for staff and students, supporting 30+ staff members",
      "Handled 80 tickets per week: password and Net ID changes, service activation, printer troubleshooting and VPN setup on staff mobile devices",
    ],
  },
];

export interface Flow { nodes: string[]; caption: string }
export interface CaseStudy {
  slug: string; title: string; org: string; when: string; tag: string; summary: string;
  problem: string; role: string; did: string[]; stat?: string; stack: string[]; results: string[]; flow: Flow; next?: string; status?: string;
  /** show the Assess / Plan / Build / Document approach */ approach?: boolean; /** show the on-site clips and photos */ media?: boolean;
}
export const studies: CaseStudy[] = [
  {
    slug: "multisite-healthcare-network", title: "Owning a multisite healthcare network", org: "Marks Home Care Agency", when: "2024 – Present", tag: "Networking", approach: true, media: true,
    summary: "Sole internal IT resource keeping a distributed healthcare organization connected: firewalls, site-to-site VPNs, switching, wireless and VLAN segmentation.",
    problem: "A home care agency with multiple branch locations needs every site connected, secure and supported in person. Its third-party MSP works remotely and can't handle physical issues, onsite escalations or site-specific troubleshooting.",
    role: "Primary internal IT infrastructure owner and the only internal onsite IT resource, working alongside the company's MSP.",
    did: [
      "Configure and troubleshoot SonicWall firewalls and site-to-site VPN tunnels that connect the branches",
      "Run routers, switches, core switch uplinks and Ubiquiti wireless access points, with VLAN segmentation across sites",
      "Handle the physical infrastructure issues, escalations and site-specific troubleshooting the MSP's remote helpdesk cannot complete",
      "Respond to network outages, urgent hardware failures and branch leadership requests",
      "Create and maintain IT equipment layouts, site blueprints and branch documentation",
    ],
    stack: ["SonicWall", "Site-to-site VPN (IPSec)", "VLANs", "UniFi / Cisco switching", "Ubiquiti APs", "Core switch uplinks"],
    results: ["Documentation that improves asset visibility and reduces troubleshooting time", "Network reliability, hardware lifecycle management, onsite escalation and business continuity across branch locations"],
    flow: { nodes: ["Main office", "SonicWall", "Site-to-site VPN", "Branch SonicWall", "VLAN-segmented branch LAN"], caption: "Simplified and generalized. No real addresses or site details are shown." },
  },
  {
    slug: "branch-relocations", title: "Branch relocations and buildouts", org: "Marks Home Care Agency", when: "2024 – Present", tag: "Infrastructure delivery", approach: true, media: true,
    summary: "Onsite technology readiness for branch moves and new offices, from network prep to the first day of work.",
    problem: "When a branch moves or a new office opens, the network, workstations and printers must be ready on day one, with no gap in patient-facing operations.",
    role: "Lead onsite infrastructure execution for every move and buildout.",
    did: [
      "Network readiness at the new site before the move",
      "Hardware transport, workstation setup and printer/scanner deployment",
      "Standardized endpoints and complete new-hire technology setups",
      "Post-move troubleshooting and support",
      "Site blueprints and equipment layouts that make the next move easier to plan",
    ],
    stack: ["Network cabling", "Switching", "Wireless APs", "Endpoint provisioning", "Printers / scanners", "Docking stations"],
    results: ["Branches open with working technology", "Reusable blueprints for future moves"],
    flow: { nodes: ["Site survey", "Network readiness", "Move and setup", "Post-move support", "Blueprint updated"], caption: "The repeatable move process." },
  },
  {
    slug: "pbx-to-voip", stat: "500 users · 99.99%", title: "Moving a luxury hotel from PBX to VoIP", org: "The Mark Hotel", when: "2023 – 2024", tag: "Migration",
    summary: "500 users migrated from a legacy PBX to NEC VoIP with 99.99% call availability after the transition.",
    problem: "A legacy PBX phone system had to be replaced in an operation where phones can't go down.",
    role: "System Analyst on the migration.",
    did: ["Migrated 500 users from the legacy PBX to NEC VoIP", "Produced migration plans with risk assessments and dependency mapping for 50+ business-critical applications"],
    stack: ["NEC VoIP", "Migration planning", "Risk assessment", "Dependency mapping"],
    results: ["500 users migrated", "99.99% call availability post-transition"],
    flow: { nodes: ["Legacy PBX", "Risk and dependency mapping", "Phased cutover", "NEC VoIP"], caption: "Simplified migration path." },
  },
  {
    slug: "active-directory-security", stat: "95% fewer incidents", title: "Tightening Active Directory security", org: "The Mark Hotel", when: "2023 – 2024", tag: "Identity and security",
    summary: "Active Directory security policies for 300+ users cut unauthorized access incidents by 95%.",
    problem: "Access control across 300+ users needed to be enforced consistently.",
    role: "System Analyst responsible for Active Directory and the Windows Server environment.",
    did: ["Enforced Active Directory security policies for 300+ users", "Maintained a Windows Server environment of 10+ physical and 20+ virtual machines", "Managed Microsoft 365 license assignments and access for SharePoint, Exchange Online and Teams"],
    stack: ["Active Directory", "Group Policy", "Windows Server", "Virtual machines", "Microsoft 365"],
    results: ["95% fewer unauthorized access incidents", "A stable Windows Server environment (10+ physical, 20+ virtual)"],
    flow: { nodes: ["Users and groups", "AD security policies", "Windows Server (10+ physical, 20+ VMs)", "Microsoft 365 access"], caption: "Simplified identity flow." },
  },
  {
    slug: "network-reliability", stat: "25% fewer outages", title: "Finding the bottlenecks behind network outages", org: "Penn Medicine University Hospital", when: "2021 – 2022", tag: "Networking",
    summary: "Packet analysis and DNS/DHCP troubleshooting lowered network outages and monthly downtime incidents by 25% each.",
    problem: "A university hospital environment with 5,000+ users was seeing network outages and recurring downtime incidents.",
    role: "Senior IT Support Specialist.",
    did: ["Used packet analysis to identify network bottlenecks", "Troubleshot DNS, DHCP and IP issues", "Operated ServiceNow ITSM for 5,000+ users, managing patches and upgrades to minimize business impact"],
    stack: ["Packet analysis", "DNS / DHCP", "TCP/IP", "ServiceNow ITSM", "Patch management"],
    results: ["25% fewer network outages", "25% fewer monthly downtime incidents"],
    flow: { nodes: ["Outage reports", "Packet capture and analysis", "Root cause (bottleneck, DNS/DHCP)", "Fix and verify"], caption: "The troubleshooting loop." },
  },
  {
    slug: "l3-escalations", stat: "92% in 3 hours", title: "Fast L3 escalations at a bank", org: "Santander Bank", when: "2022 – 2023", tag: "IT operations",
    summary: "92% of L3 escalations closed within 3 hours, improving productivity 20%.",
    problem: "Banking staff need complex escalations resolved quickly to keep working.",
    role: "Senior IT Support Specialist handling L3 escalations and network administration.",
    did: ["Closed L3 escalations against a 3-hour window", "Administered TCP/IP networks supporting 300+ users", "Trained new hires on SharePoint and Active Directory"],
    stack: ["TCP/IP networking", "Active Directory", "SharePoint", "Escalation management"],
    results: ["92% of L3 escalations closed within 3 hours", "20% productivity improvement", "10% network performance increase", "95% training satisfaction score"],
    flow: { nodes: ["L3 escalation", "Diagnose", "Resolve within 3 hours", "Document and train"], caption: "The escalation path." },
  },
  {
    slug: "server-validation", title: "Validating enterprise servers for cloud providers", org: "ZT Systems Data Center", when: "2019 – 2021", tag: "Data center",
    summary: "Daily testing, failure isolation and build validation for enterprise server platforms, including Amazon and Microsoft hardware.",
    problem: "Enterprise and cloud server builds must be proven production-ready before they ship.",
    role: "Computer Server Technician / Tester.",
    did: ["Troubleshot, tested and validated multiple enterprise server systems daily", "Configured server builds for major cloud and enterprise environments, including Amazon and Microsoft server hardware platforms", "Executed test procedures, documented failures and assisted engineering with root-cause analysis", "Built systems from physical assembly through network cabling and component validation"],
    stack: ["Server hardware", "Rack builds", "Network cabling", "Hardware diagnostics", "Test procedures", "Root-cause analysis"],
    results: ["Production-ready server builds for major cloud and enterprise environments"],
    flow: { nodes: ["Assembly", "Cabling", "Component validation", "Test and diagnose", "Production ready"], caption: "Build and validation pipeline." },
  },
  {
    slug: "home-lab", title: "Home lab: backup, automation and clustering", org: "Personal project", when: "2026", tag: "Home lab", status: "In progress",
    summary: "A UniFi-switched lab with a Synology NAS, offsite backups to AWS S3 and self-hosted n8n in Docker, where I test changes before they reach production.",
    problem: "I wanted a place to practice production-grade backup, networking and automation, and to test before changing real environments.",
    role: "Designed, built and maintain it.",
    did: ["Built a lab with a Synology NAS, UniFi switch and wireless AP, UPS power protection and two wired workstations, one with remote access", "Configured offsite backups with Synology Hyper Backup to AWS S3", "Deployed self-hosted n8n in Docker (Synology Container Manager) on a static-IP NAS to automate lab and infrastructure workflows"],
    stack: ["Synology NAS", "Hyper Backup", "AWS S3", "Docker", "n8n", "UniFi", "UPS"],
    results: ["Offsite, cloud-based data protection and recovery", "A safe place to test before production"],
    next: "Automated cluster builds across the lab hosts as the environment expands.",
    flow: { nodes: ["Workstations", "UniFi switch", "Synology NAS", "Hyper Backup", "AWS S3"], caption: "Backup path. Lab addresses are not shown." },
  },
  {
    slug: "automation-platform", title: "Automation platform for a midterm rental platform", org: "Independent project", when: "2026", tag: "Automation",
    summary: "n8n workflows, secured webhook APIs and a React dashboard that draft, check and report on content, with a person approving everything before it goes out.",
    problem: "A pre-launch midterm rental platform needed its content, scheduling and reporting work automated, without anything publishing unreviewed.",
    role: "Designed and built it, using AI-assisted development.",
    did: [
      "Designed and built n8n workflows behind a content and operations dashboard, with webhook APIs secured by header authentication and backed by n8n data tables",
      "Connected the Facebook and Instagram Graph APIs for page and performance data",
      "Added AI writing steps with hard rule checks (fair housing, claims) and required human approval before anything publishes",
      "Built the dashboard in React and TypeScript, deployed from GitHub to Netlify",
    ],
    stack: ["n8n", "Webhooks / header auth", "n8n data tables", "Facebook & Instagram Graph API", "LLM APIs", "React", "TypeScript", "GitHub", "Netlify"],
    results: ["Nothing publishes without human approval", "Rule checks run on every AI draft before review"],
    flow: { nodes: ["Dashboard (React)", "Webhook API (header auth)", "n8n workflows", "AI draft + rule checks", "Human approval"], caption: "Simplified. No company, account or credential details are shown." },
  },
];

export interface SkillGroup { name: string; items: { skill: string; studies?: string[] }[] }
export const skills: SkillGroup[] = [
  { name: "Networking", items: [
    { skill: "Routing / switching", studies: ["multisite-healthcare-network"] }, { skill: "VLANs", studies: ["multisite-healthcare-network"] }, { skill: "Firewalls (SonicWall)", studies: ["multisite-healthcare-network"] },
    { skill: "Site-to-site and remote VPN", studies: ["multisite-healthcare-network"] }, { skill: "IPSec", studies: ["multisite-healthcare-network"] }, { skill: "Wireless APs (Ubiquiti)", studies: ["multisite-healthcare-network"] },
    { skill: "Core switch uplinks", studies: ["multisite-healthcare-network"] }, { skill: "ISP cutovers" }, { skill: "Backbone networking" }, { skill: "Network troubleshooting", studies: ["network-reliability"] },
    { skill: "DNS / DHCP / TCP/IP", studies: ["network-reliability", "l3-escalations"] }, { skill: "Site readiness", studies: ["branch-relocations"] } ] },
  { name: "Systems and identity", items: [
    { skill: "Windows Server", studies: ["active-directory-security"] }, { skill: "Active Directory", studies: ["active-directory-security", "l3-escalations"] }, { skill: "Group Policy", studies: ["active-directory-security"] },
    { skill: "Microsoft Entra ID" }, { skill: "MFA" }, { skill: "Conditional Access" }, { skill: "RBAC" }, { skill: "SCCM" }, { skill: "Hyper-V" }, { skill: "VMware" },
    { skill: "Microsoft 365", studies: ["active-directory-security"] }, { skill: "Microsoft Azure" }, { skill: "Ubuntu" }, { skill: "SSH" } ] },
  { name: "Hardware and data center", items: [
    { skill: "Server hardware troubleshooting", studies: ["server-validation"] }, { skill: "Rack / server builds", studies: ["server-validation"] }, { skill: "Network cabling", studies: ["server-validation", "branch-relocations"] },
    { skill: "Hardware provisioning", studies: ["branch-relocations"] }, { skill: "Endpoint lifecycle management", studies: ["branch-relocations"] }, { skill: "Printers / scanners / docks", studies: ["branch-relocations"] } ] },
  { name: "IT operations and delivery", items: [
    { skill: "ServiceNow", studies: ["network-reliability"] }, { skill: "Jira" }, { skill: "SLA management", studies: ["l3-escalations"] }, { skill: "Change planning", studies: ["pbx-to-voip"] },
    { skill: "Vendor coordination", studies: ["multisite-healthcare-network"] }, { skill: "MSP oversight", studies: ["multisite-healthcare-network"] }, { skill: "Asset tracking", studies: ["branch-relocations"] },
    { skill: "Documentation and runbooks", studies: ["multisite-healthcare-network"] }, { skill: "Escalation response", studies: ["l3-escalations"] } ] },
  { name: "Security and reliability", items: [
    { skill: "CompTIA Security+" }, { skill: "Firewall policy support", studies: ["multisite-healthcare-network"] }, { skill: "Vulnerability management" }, { skill: "Access control", studies: ["active-directory-security"] },
    { skill: "Incident triage", studies: ["network-reliability"] }, { skill: "Disaster recovery planning", studies: ["home-lab"] }, { skill: "Operational risk reduction", studies: ["pbx-to-voip"] } ] },
  { name: "Automation and cloud", items: [
    { skill: "PowerShell / Python scripting" }, { skill: "n8n automation", studies: ["automation-platform", "home-lab"] }, { skill: "Webhooks / REST APIs", studies: ["automation-platform"] }, { skill: "React / TypeScript", studies: ["automation-platform"] }, { skill: "Docker", studies: ["home-lab"] }, { skill: "AWS S3", studies: ["home-lab"] }, { skill: "Synology Hyper Backup", studies: ["home-lab"] } ] },
];

export const education = {
  degree: { school: "Ramapo College of New Jersey", detail: "B.A., Social Science", year: "2016", place: "Mahwah, NJ" },
  certifications: ["CompTIA Security+"],
  training: [{ name: "System Administration", by: "Microsoft / LinkedIn" }, { name: "Practical Ethical Hacking", by: "TCM Security" }],
};

/** Role-focused views: the same facts, with the most relevant work first. */
export const tracks = [
  { slug: "infrastructure", label: "Infrastructure Engineer", studies: ["multisite-healthcare-network", "home-lab", "pbx-to-voip", "server-validation", "active-directory-security", "branch-relocations"], focus: ["Networking", "Systems and identity", "Hardware and data center"] },
  { slug: "systems", label: "Systems Administrator / Engineer", studies: ["active-directory-security", "pbx-to-voip", "home-lab", "network-reliability", "multisite-healthcare-network", "server-validation"], focus: ["Systems and identity", "Security and reliability", "Automation and cloud"] },
  { slug: "network", label: "Network Engineer", studies: ["multisite-healthcare-network", "network-reliability", "branch-relocations", "home-lab", "l3-escalations", "pbx-to-voip"], focus: ["Networking", "Security and reliability"] },
  { slug: "endpoint", label: "Desktop / Endpoint Engineer", studies: ["branch-relocations", "multisite-healthcare-network", "l3-escalations", "active-directory-security", "server-validation", "network-reliability"], focus: ["Hardware and data center", "Systems and identity", "IT operations and delivery"] },
  { slug: "it-operations", label: "IT Operations Engineer", studies: ["l3-escalations", "network-reliability", "multisite-healthcare-network", "branch-relocations", "pbx-to-voip", "home-lab"], focus: ["IT operations and delivery", "Security and reliability", "Networking"] },
] as const;
export type TrackSlug = (typeof tracks)[number]["slug"];
