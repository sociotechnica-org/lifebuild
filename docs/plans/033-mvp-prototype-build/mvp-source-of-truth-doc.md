# **LBM MVP \- Source of Truth Document**

## **Executive Summary**

**What we're building:** A visual work management system where Directors see their life's work spatially organized across eight domains, with a three-stream priority model (Gold/Silver/Bronze) that makes planning and execution intuitive.

**The bets we're making:**

* Visual representation of work creates agency, quality & velocity  
* Directors live better lives when they outsource to AI agents

**The bets we're mostly tabling**:

* Superior Process \= Superior Results  
* Building a Lifetime Relationship with a Team of Super Agents

---

### **The Core Experience**

**The Life Map** — All projects displayed as evolving visual artifacts in eight category cards (Health, Finances, Relationships, Home, Community, Leisure, Personal Growth, Purpose).

**The Table** — Persistent priority spotlight showing current commitments:

* Gold slot: One transformative project (or empty)  
* Silver slot: One infrastructure project (or empty)  
* Bronze stack: Operational tasks (min 3 to activate / get started)

**Project Creation** — Guided 4-stage flow (Identified → Scoped → Drafted → Prioritized) turns vague ideas into fully-planned projects with task lists.

**Worker Staffing** — Guided 4-stage flow (Project Review → Worker Profile → Prompt Configuration → Confirmation) creates custom AI agents matched to project needs.

**Urushi Evolution** — Projects visually mature through five stages: Sketch → Foundation → Color → Polish → Decoration. Work feels alive, gains depth as you invest in it.

**Simple Execution** — Click project card → see kanban board → move tasks → watch progress.

**Continuous Rhythm** — Plan when ready, activate priorities anytime, adapt as circumstances change. No forced schedule.

### **System Architecture**

LIFE MAP (where you work)  
├── The Table (Gold \+ Silver \+ Bronze)  
└── 8 Category Cards (all projects in each domain)  
    ↑ reads from

WORK STATE SYSTEM  
├── Planning Queue (Stages 1-3, in-progress)  
└── Priority Queue (Stage 4, ready to activate)  
    ↑ creates/modifies

PROJECT MANAGEMENT ROOMS  
├── Drafting Room (4-stage project creation)  
├── Sorting Room (pick priorities)  
└── Roster Room (4-stage worker staffing)

**Core Entities:** Project, Task, AI Worker, The Table, Priority Queue, Planning Queue, Category, Category Card

**Key Constraints:**

* Projects progress 1→2→3→4 sequentially (no skipping)  
* Max 1 Gold, max 1 Silver on Table  
* Min 3 Bronze tasks to activate priorities  
* One Worker per project (MVP limitation)  
* Work at Hand appears two places: Table \+ Category Card (same object)

---

## **What We're NOT Building**

Strategic simplification for faster delivery and testing the most important parts.

### **❌ Strategic Planning & Agile Workflow Frameworks**

**Excluded:**

* Personal charter creation (vision, values, themes)  
* Quarterly goals and milestone tracking  
* Director Attributes (Energy, Processing Power, Agency, etc.)  
* Structured planning rhythms or ceremonies  
* Council Chamber "Strategize" phase  
* Category Advisor consultations  
* Sprint retrospectives  
* WIP Limits enforcement

**Result:** Directors just create projects and do them. No process tax, no guardrails for under or over processing.

### **❌ Sophisticated AI Behavior**

**Excluded:**

* Agent personality development and fancy art  
* Pattern recognition and learning over time  
* Proactive suggestions based on behavior  
* Natural language project creation  
* Agent-to-agent coordination  
* Memory building across sessions

**Result:** Agents are functional chat windows. They help when asked, don't anticipate needs. Much simpler state management.

### **❌ Archives & Analytics**

**Excluded:**

* Historical repository with search  
* Performance metrics and trends  
* Pattern recognition ("you abandon Health projects in December")  
* Conan the Librarian  
* Completion rate tracking

**Result:** Completed projects disappear. No retrospective analysis. System doesn't get smarter over time.

### **❌ Advanced Delegation**

**Excluded:**

* Human delegation configuration  
* Automation setup for recurring work  
* Multi-agent teams with coordination  
* Worker performance tracking  
* Delegation effectiveness analysis

**Result:** Simple AI Worker assignment only. One worker per project. No human delegation complexity. No automation infrastructure.

### **✅ What STAYS: The Visual Core \+ Real AI Workers**

This is the main bet & differentiation:

* Urushi image evolution (5 stages: Sketch → Foundation → Color → Polish → Decoration)  
* Progress rings (colored borders filling as tasks complete)  
* Category color system (8 distinct colors)  
* The Table three-position layout (Gold/Silver/Bronze spatial metaphor)  
* Dual presence rendering (Work at Hand on Table \+ Category Card)  
* State-based visual treatment (glow, saturation, animation)  
* Category Cards as spatial containers  
* Overview/Domain/Execution altitude navigation  
* Real AI Worker delegation with custom staffing workflow

---

# **SECTION 1: INTRODUCTION**

*This section establishes core concepts and design philosophy.*

## **1.1 What is LifeBuild?**

LifeBuild is a visual work management system that helps people—called **Directors**—manage personal projects across all domains of life.

The system rests on three foundational insights:

**Spatial thinking over linear lists** — Most productivity tools force directors into lists (today's tasks, this week's priorities, upcoming deadlines). But humans don't think this way. We think spatially about our lives: "health is suffering while career thrives," "relationships feel neglected," "finances are stable." LifeBuild makes this spatial mental model visible.

**Visual work representation** — Projects aren't abstract database entries—they're living visual artifacts that evolve as directors invest effort. A project starts as a sketch and matures into polished, decorated art. This creates psychological investment and makes progress tangible.

**AI as teammates, not tools** — AI Workers aren't features directors "use"—they're colleagues directors work with. Each Worker has identity, capabilities, and purpose defined collaboratively between director and system.

## **1.2 Core Concepts**

### **The Director**

The person using LifeBuild. Decision-maker, strategist, executor. Not just task-completer—the director shapes what work exists, which work matters most, and how to approach it.

### **Life Categories: Eight Domains**

Work divides spatially into eight categories representing major life domains:

1. **Health** — Physical fitness, nutrition, medical care, mental health  
2. **Purpose** — Career, calling, meaningful contribution, professional development  
3. **Finances** — Income, expenses, investments, financial planning  
4. **Relationships** — Family, friendships, romantic partnerships, social connections  
5. **Home & Environment** — Living space, maintenance, organization, comfort  
6. **Community** — Civic engagement, volunteering, neighborhood, causes  
7. **Leisure** — Recreation, hobbies, entertainment, play  
8. **Personal Growth** — Learning, skills development, self-reflection, character

Each category gets a **Category Card** on the Life Map—a visual container showing all projects in that domain.

### **The Three-Stream Model**

Work flows through three streams, each serving different purposes:

**Gold Stream** — Transformative frontier-opening work. Major initiatives that unlock new capabilities or open new horizons. One project at a time or intentionally empty. Examples: "Launch photography business," "Complete graduate degree," "Build home addition."

**Silver Stream** — Infrastructure and capability-building work. System builds and discovery missions that buy future time or develop leverage. One project at a time or intentionally empty. Examples: "Implement automated bill payment," "Research investment strategies," "Build project template system."

**Bronze Stream** — Operational execution. Multiple small tasks that keep life running. Minimum 3 tasks required, can scale up based on capacity. Examples: "Schedule dentist appointment," "Pay utility bills," "Replace air filters," "Respond to emails."

This model acknowledges that not all work is equal—some work transforms, some work builds leverage, some work just needs doing.

### **The Table**

A persistent visual spotlight at the top of the Life Map showing current priorities across all three streams. Gold slot on left, Silver slot in center, Bronze stack on right. Always visible regardless of navigation. The answer to "what am I working on right now?"

### **Work at Hand**

Projects currently active on The Table. They receive enhanced visual treatment (Polish-stage images, stronger glow, breathing animation) and appear in two places simultaneously: their position on The Table AND their home Category Card (dual presence).

## **1.3 Design Philosophy**

LifeBuild embraces **dignified gamification** with **contemplative aesthetics**, using **warm neutrals**, **humanist typography**, and **tactile digital materials**.

**Dignified Gamification** — Progress tracking and visual feedback that respects adult intelligence while maintaining engagement. Acknowledges achievement without infantilizing.

**Contemplative Aesthetics** — Visual atmosphere that encourages focus and reflection rather than urgency. Design choices create room for thoughtful decision-making.

**Warm Neutrals** — Foundation colors: earth tones, soft grays, muted backgrounds that provide visual calm. Colors recede when working, allowing content to take center stage.

**Humanist Typography** — Letterforms with warmth and personality. Clear hierarchy and generous spacing prioritizing readability.

**Tactile Digital Materials** — Interface elements suggesting physical qualities: subtle shadows, gentle transitions, responsive feedback creating sensation of manipulating real objects.

## **1.4 How Directors Succeed**

Directors succeed with LifeBuild not by completing lists, but by building **compound capability**—creating infrastructure, knowledge, and support systems that make future work progressively easier.

**Mastery through visibility** — Can't improve what can't see. The Life Map creates legibility across whole life.

**Strategic capacity investment** — Silver stream builds leverage. Each System Build or Discovery Mission makes future weeks easier.

**Sustainable pacing** — Three streams enable directors to balance transformation (Gold), leverage-building (Silver), and operations (Bronze) based on current capacity.

**AI force multiplication** — Delegating to AI Workers frees directors to focus on uniquely human leadership and decision-making.

The director isn't just completing tasks—they're developing judgment and building capability.

---

# **SECTION 2: THE WORKSPACES**

*This section provides spatial orientation—where everything happens and how to navigate between spaces.*

## **2.1 Two Workspace Types**

LifeBuild MVP has two distinct environments:

**Life Map** — The execution workspace where Directors work on projects. This is where 90% of time is spent.

**Project Management Rooms** — Three specialized spaces where Directors plan work: Drafting Room (project creation), Sorting Room (priority selection), and Roster Room (AI Worker staffing). Accessed when planning new work or adjusting priorities.

Think of these as rooms in a workshop: The Life Map is the workbench where you build. The Project Management Rooms are the planning desk where you organize before building.

## **2.2 The Life Map: Primary Workspace**

### **2.2.1 Overview**

The Life Map is the primary execution interface—the space where directors spend most of their time working on projects.

**Layout:**

* **The Table** at top: Current priorities (Gold \+ Silver \+ Bronze)  
* **8 Category Cards** below: All projects organized by domain  
* Clean grid arrangement with breathing room between elements

**Always visible:** The Table remains at top regardless of navigation depth. Current priorities never disappear from view.

### **2.2.2 The Table (Detailed)**

**Purpose:** Persistent priority spotlight showing current commitments.

**Layout:** Three distinct positions left-to-right:

**Gold Slot (left):**

* One transformative project OR intentionally empty  
* Enhanced visual treatment: Polish-stage Urushi image, gold accent glow, breathing animation  
* Clicking opens Project Board overlay

**Silver Slot (center):**

* One infrastructure project OR intentionally empty  
* Enhanced visual treatment: Polish-stage Urushi image, silver accent glow, breathing animation  
* Clicking opens Project Board overlay

**Bronze Stack (right):**

* Minimum 3 tasks, scales based on mode  
* Tasks displayed as stacked cards with "+X more" notation  
* Clicking individual task marks complete  
* Clicking stack expands to show all tasks

**Three Bronze Modes:**

* **Minimal** — Only tasks with due dates or critical responses (could be 3, could be 40\)  
* **Target \+X** — Minimal tasks plus X discretionary tasks from queue (Director sets X)  
* **Maximal** — Minimal tasks plus continuous queue pull (all high-priority Bronze work)

**Visual Distinction:** The Table uses enhanced contrast, stronger glows, and breathing animations to distinguish current priorities from other work. These aren't just any projects—they're what matters most right now.

### **2.2.3 Category Cards**

**Purpose:** Spatial containers showing all projects within one life domain.

**Each Category Card displays:**

* Category name and color accent  
* Count summaries by project status:  
  * "3 Work at Hand" (projects also on The Table)  
  * "5 Live" (active projects not on Table)  
  * "8 Plans" (fully-planned, waiting to activate)  
  * "2 Paused" (temporarily stopped projects)

**Visual States:**

* **Work at Hand projects:** Full saturation, standard glow, progress ring, subtle pulse matching stream color (dual presence—also appears on Table)  
* **Live projects:** Full saturation, standard glow, progress ring  
* **Plans:** Reduced saturation (70%), no glow, Color Emergence stage image  
* **Paused:** Further reduced saturation (50%), muted glow, Polish stage image (preserved)

**Collapsed stacks:** When category has many projects in one status (e.g., 8 Plans), they collapse with "+X" notation. Click to expand and see all cards.

**Interaction:** Clicking Category Card background zooms to Domain Altitude. Clicking individual Project Cards opens Project Board overlays where actual task work happens.

### **2.2.4 Navigation: Three Altitudes**

**Overview Altitude (default Life Map view):**

* All 8 Category Cards visible in grid layout  
* Each card shows summary counts: "3 Live, 5 Plans, 1 Paused"  
* The Table persistent at top of screen  
* Click card background → zoom to Domain Altitude

**Domain Altitude (single category focus):**

* Selected category card fills 80% of screen  
* Adjacent categories dimmed in background (spatial context)  
* The Table remains visible at top  
* Shows expanded view: all project cards visible (not just counts)  
* Collapsed stacks can expand: "+5 Plans" → fans out 5 cards  
* Click individual Project Card → opens Project Board overlay  
* Click outside or ESC → return to Overview Altitude

**Execution Altitude (Project Board overlay):**

* Project Board fills 80% of screen  
* Background (Life Map) dimmed to 30% but still visible (spatial memory)  
* The Table remains visible at very top (slightly dimmed)

**Project Board Contents:**

**Project Header:**

* Urushi image (current evolution stage)  
* Project title and category color accent  
* Progress indicator: "5 of 12 tasks complete (42%)"  
* Progress ring around Urushi image filling clockwise  
* Category seal (subtle watermark)

**Kanban Board** (three columns):

* To Do | In Progress | Done  
* Drag tasks between columns  
* In Progress suggests 3-task focus (visual cue, not enforced)  
* Check Done moves task to Done column  
* All tasks Done triggers project completion

**Team Assignment** (sidebar or bottom):

* "Team Members: \[Worker avatar/name\]"  
* Shows assigned worker profile (click to view full synopsis)  
* Button: "Edit Worker" → returns to Roster Room  
* Button: "Assign Tasks to Worker" → delegation interface  
* Worker status indicator (Available / Working / Awaiting Review)

**Interaction:**

* Drag tasks between columns  
* Click task to see details and assigned Worker  
* Click "Edit Worker" → Roster Room for modifications  
* Click outside or ESC → return to previous altitude

The flow: Overview altitude → Domain altitude → Execution altitude → back to Domain or Overview as needed.

---

## **2.3 Project Management Rooms**

Three specialized spaces for planning work. Directors access these when planning new work or adjusting current priorities—no fixed schedule required.

### **2.3.1 Drafting Room: Project Creation**

**Who's here:** Marvin, the Director's project manager

**What happens:** This is where Directors create projects through a 4-stage process and manage two queues:

**The Planning Queue** (top section):

* Holds projects currently moving through Stages 1-3 of creation  
* These are projects in development—not yet fully planned  
* Each project shows: image in early stage (sketch/foundation/color), stage indicator ("Stage 2 of 4 \- Scoped"), category seal, last modified date  
* Directors can click any project to resume work, pause and return later (autosave preserves progress), or abandon projects no longer relevant  
* Typical state: 0-3 projects (temporary workspace)

**The Priority Queue** (main section):

* Displays all fully-planned work (Stage 4 complete) ready to activate  
* Three filter views: Gold Candidates, Silver Candidates, Bronze Candidates  
* Gold Candidates: Shows only Major Initiatives and Epic-scale projects  
* Silver Candidates: Shows only System Builds, Discovery Missions, and capacity-building projects  
* Bronze Candidates: Shows only tasks and micro-projects  
* Paused projects automatically jump to top of appropriate filter  
* Directors can reorder priorities within each filter

**The 4-Stage Creation Process** (detailed in Section 4.3):

* Stage 1: Identified (2 min) \- Title, description, category  
* Stage 2: Scoped (10 min) \- Objectives, archetype, traits  
* Stage 3: Drafted (30 min) \- Task generation with Marvin, refinement  
* Stage 4: Prioritized (5 min) \- Position in Priority Queue

Once Stage 4 completes, project exits Planning Queue and enters Priority Queue.

### **2.3.2 Sorting Room: Priority Selection**

**Who's here:** Cameron, the Director's Operational Coordinator

**What happens:** When Directors are ready to change what's on The Table, they come here to select new priorities.

**When to use:**

* Table is empty and Director wants to activate work  
* Current Gold or Silver project completes  
* Director wants to swap priorities (pause current, activate different)  
* Director wants to adjust Bronze mode/task count  
* Ready to start working after creating several projects

**The Process:**

1. View Priority Queue with three-stream filtering  
2. Apply Gold Candidates filter → Select Gold project (or leave empty)  
3. Apply Silver Candidates filter → Select Silver project (or leave empty)  
4. Apply Bronze Candidates filter → Review tasks, configure Bronze mode  
5. Activate selections (validates min 3 Bronze tasks)

**Bronze Mode Configuration:**

* Set Minimal / Target \+X / Maximal  
* If Target, specify X (number of discretionary tasks)  
* See which tasks have due dates (Minimal requirement)  
* Reorder Bronze candidates if priorities shifted

**Activation:**

* Review selected Gold project (or note intentionally empty)  
* Review selected Silver project (or note intentionally empty)  
* Confirm Bronze mode and task count (minimum 3\)  
* Validate: Can't activate without 3+ Bronze tasks  
* Button: "Activate Priorities"  
* On activation: Returns to Life Map, Work at Hand updated

**No forced schedule:** Directors can activate priorities whenever they want—daily, weekly, monthly, or only when current work completes. The system doesn't enforce a cadence.

### **2.3.3 Roster Room: AI Worker Staffing**

**Who's here:** Devin, the Director's staffing manager

**What happens:** Projects ready for AI assistance are staffed through a guided workflow that creates custom AI Workers matched to project needs.

**The Staffing Queue:**

* Displays Work at Hand projects (Gold/Silver) eligible for AI delegation  
* Shows projects in priority order (Gold first, then Silver)  
* Each project shows: Urushi image, title, category, "1 empty position" indicator  
* Directors select which project to staff first

**The Staffing Process** (detailed in Section 4.5):

* **Stage 1: Project Review** (2 min) \- Devin presents project context, objectives, task breakdown  
* **Stage 2: Worker Profile** (5 min) \- Devin drafts recommended worker synopsis based on project needs  
* **Stage 3: Prompt Configuration** (10 min) \- Devin generates corresponding worker prompt, Director refines  
* **Stage 4: Confirmation** (2 min) \- Review and officially staff the project

**Worker Templates:**

Devin maintains 10 pre-configured worker templates for common roles:

* Research Specialist  
* Content Creator  
* Data Analyst  
* Project Coordinator  
* Communication Manager  
* Design Assistant  
* Technical Reviewer  
* Quality Controller  
* Administrative Support  
* Learning Facilitator

**Post-Staffing:**

* Worker appears in Project Board under "Team" section  
* Worker available for task assignment within that project  
* Director can click "Edit Worker" to return to Roster Room and modify worker profile/prompt  
* Worker remains assigned until project completes or is explicitly removed

**MVP Constraint:** One worker per project. Future versions will support multi-agent teams with specialized roles.

### **2.3.4 Moving Between Spaces**

**Header navigation:** Life Map | Drafting Room | Sorting Room | Roster Room

**Keyboard shortcuts:**

* L for Life Map  
* D for Drafting Room  
* S for Sorting Room  
* R for Roster Room

**Context preservation:**

* ESC or ← back returns to previous space  
* "Activate Priorities" in Sorting Room returns to Life Map  
* Director's place always preserved

**Visual consistency:** Same warm neutrals, humanist typography, tactile materials, and category colors throughout. Moving between spaces feels like moving between rooms in the same workshop, not switching applications.

---

# **SECTION 3: THE GAME PIECES**

*This section catalogs the fundamental building blocks that exist in LifeBuild. You've seen where they live (Section 2). Now you'll understand what they are and what properties they have. Section 4 will show how these pieces move through the system.*

---

## **3.1 Projects: The Core Unit of Work**

**Definition:** A project is a discrete initiative within a Life Category—the core unit of work in LifeBuild.

### **3.1.1 Project Properties**

Every project has:

**Identity & Classification:**

* **Title** \- Short, specific name (e.g., "Kitchen Renovation")  
* **Description** \- 1-3 sentence overview of intent  
* **Category** \- Which of 8 life domains this belongs to (Health, Purpose, Finances, etc.)  
* **Archetype** \- Fundamental nature: Initiative, System Build, Discovery Mission, Quick Task, or Critical Response

**Planning Data:**

* **Objectives** \- 1-3 specific, measurable outcomes that define success  
* **Deadline** (optional) \- When project must complete  
* **Traits** \- Five dimensions describing project characteristics:  
  * **Scale:** Micro, Minor, Moderate, Major, Epic  
  * **Urgency:** Low, Medium, High, Critical  
  * **Importance:** Low, Medium, High, Critical  
  * **Complexity:** Simple, Moderate, Complex, Highly Complex  
  * **Uncertainty:** Known, Some Unknowns, Highly Uncertain, Exploratory

**Execution Data:**

* **Tasks** \- Concrete actions that comprise the work (generated in Stage 3\)  
* **Progress** \- Percentage complete (tasks done / total tasks)  
* **Assigned Worker** (optional) \- AI Worker helping with execution

**Visual Representation:**

* **Urushi Image** \- Evolving artwork showing project maturity (5 stages)  
* **Progress Ring** \- Colored border that fills clockwise as tasks complete  
* **Category Color** \- Accent color matching life domain

### **3.1.2 Project Archetypes**

**Initiative** — Forward movement toward goals. Creating something new, making progress on objectives. Scale typically Moderate to Epic. Examples: "Launch side business," "Complete graduate degree," "Build home addition."

**System Build** — Infrastructure and capability development. Building systems that reduce future friction. Scale typically Moderate to Major. Examples: "Implement automated bill payment," "Create home filing system," "Build project template library."

**Discovery Mission** — Research and information gathering. Learning, exploring, investigating before committing. Scale typically Minor to Moderate. Examples: "Research standing desks," "Explore investment strategies," "Investigate solar panel options."

**Quick Task** — Simple, straightforward actions. One-step completion, minimal complexity. Scale always Micro. Examples: "Schedule dentist appointment," "Pay utility bill," "Replace air filters."

**Critical Response** — Urgent necessities. Unplanned work demanding immediate attention. Any scale, always High or Critical urgency. Examples: "Hurricane preparation," "Handle medical emergency," "Repair broken water heater."

### **3.1.3 Project Lifecycle States**

**Planning** — Moving through Stages 1-3 of creation in Drafting Room. Lives in Planning Queue. Not yet ready to activate.

**Plans** — Stage 4 complete, fully planned, waiting in Priority Queue. Ready to activate but never activated before.

**Work at Hand** — Currently active on The Table (Gold or Silver slot). Enhanced visual treatment, appears in two places (Table \+ Category Card).

**Live** — Active and accessible but not current priority (not on Table). Can be worked on anytime.

**Paused** — Temporarily stopped. Returns to Priority Queue at top of appropriate filter. All progress preserved.

**Completed** — All tasks done. Project archived.

### **3.1.4 The Urushi Evolution**

Projects are represented visually as Japanese lacquerware (Urushi) that matures through five stages:

1. **Sketch** (Stages 1-2) \- Light pencil outlines on off-white ground. Barely visible forms suggesting potential. Ethereal, provisional.

2. **Foundation** (Stage 3 start) \- Dark base layer applied. Strong contrast emerges. Forms become solid and grounded. Matte finish, serious commitment.

3. **Color Emergence** (Stage 3 complete) \- Category color seeps into the lacquer. Muted, dusty versions of signature colors. Personality begins showing. Still matte.

4. **Polish** (Work at Hand: Gold/Silver) \- Vibrant category colors at full saturation. Glossy finish emerges. Multiple translucent layers create depth. Light begins reflecting. Professional sheen.

5. **Decoration** (Completion) \- Gold or silver accents added to polished surface. Commemorative sculptures for Gold/Silver completions. Final artistic flourishes. Museum-quality finish.

**Bronze tasks** use simpler static iconography—they don't evolve through Urushi stages. They're operational work, not transformative projects.

**Why this matters:** Projects feel alive. They gain depth as Directors invest effort. The visual evolution creates psychological investment—you want to see your sketch become a polished piece of art.

---

## **3.2 Tasks: The Atomic Unit**

**Definition:** A single, completable action within a project. Typically 15 minutes to 2 hours of focused work.

### **3.2.1 Task Properties**

Every task has:

* **Title** \- Clear action statement (verb \+ object)  
* **Parent Project** \- Which project this task belongs to  
* **Status** \- To Do / In Progress / Done  
* **Worker Assignment** (optional) \- Which AI Worker is executing this task  
* **Due Date** (optional) \- When task must complete

### **3.2.2 Task Types (CODAD Framework)**

Tasks naturally fall into five types:

**Connect** \- Communication and coordination with other people. Examples: "Email contractor for quote," "Schedule meeting with team," "Call dentist for appointment."

**Operate** \- Hands-on physical execution. Examples: "Install new cabinet hardware," "Paint accent wall," "Organize closet."

**Discover** \- Research and information gathering. Examples: "Research countertop materials," "Compare appliance ratings," "Read reviews on contractors."

**Advance** \- Moving project forward toward objectives. Examples: "Order cabinets," "Sign contract with contractor," "Schedule permit inspection."

**Design** \- Planning, strategizing, and creating structure. Examples: "Sketch kitchen layout," "Create budget spreadsheet," "Draft project timeline."

This framework helps Marvin generate balanced task lists during Stage 3\.

### **3.2.3 Kanban Board Behavior**

Tasks live on a three-column kanban board when project is active:

**To Do** \- Tasks not yet started. Initial home for all tasks when project activates.

**In Progress** \- Tasks currently being worked on. System suggests 3-task focus (visual cue, not enforced).

**Done** \- Completed tasks. Contributes to progress ring calculation.

---

## **3.3 AI Workers: Project-Specific Teammates**

**Definition:** Custom-created agents assigned to specific projects who execute delegated tasks independently.

### **3.3.1 Worker Properties**

Every Worker has:

**Identity & Definition:**

* **Name/Title** \- Role descriptor (e.g., "Research & Analysis Specialist")  
* **Synopsis** \- 150-300 word description of role, capabilities, and approach (Director-facing)  
* **Prompt** \- 500-1000 word detailed instructions governing behavior (system-level)  
* **Template Origin** \- May derive from one of Devin's 10 standard templates

**Assignment & Scope:**

* **Project Assignment** \- Bound to single project, persists until completion  
* **Task Assignments** \- Which tasks within project this Worker is handling  
* **Status** \- Available / Working / Awaiting Review

### **3.3.2 Worker Creation**

Workers are created through 4-stage guided process in Roster Room:

1. Project Review \- Devin analyzes project needs  
2. Worker Profile \- Collaborative synopsis drafting  
3. Prompt Configuration \- Technical prompt generation and refinement  
4. Confirmation \- Official staffing

**Bidirectional editing:** If Director edits synopsis, Devin offers to regenerate prompt. If Director edits prompt, Devin checks if synopsis should update. Maintains alignment.

### **3.3.3 Worker Behavior**

**What Workers do:**

* Execute specific tasks assigned by Director  
* Operate within project boundaries (can't access other projects)  
* Follow customized prompt defining their role and approach  
* Report task completion for Director review  
* Work independently without constant supervision

**What Workers don't do (MVP):**

* Learn across projects or persist beyond project completion  
* Coordinate with other Workers  
* Proactively suggest work or anticipate needs  
* Develop sophisticated personalities or memory

**Personality:** Workers are professional, capable, and responsive. They execute assigned work without personality flourishes—efficiency over charm. They're colleagues you can rely on, not friends you chat with.

### **3.3.4 MVP Constraint**

One worker per project. Future versions will support multi-agent teams with specialized roles, but MVP keeps it simple: if you need AI help on a project, you create one Worker matched to that project's needs.

---

## **3.4 The Table: Priority Spotlight**

**Definition:** Persistent visual display at top of Life Map showing current priorities across three streams.

### **3.4.1 The Three Positions**

**Gold Slot (left):**

* Contains zero or one Initiative/Major-scale project  
* Visual treatment: Gold accent glow, Polish-stage Urushi, breathing animation  
* Represents transformative frontier-opening work  
* Can be strategically empty

**Silver Slot (center):**

* Contains zero or one System Build/Discovery Mission project  
* Visual treatment: Silver accent glow, Polish-stage Urushi, breathing animation  
* Represents infrastructure and capability-building work  
* Can be strategically empty

**Bronze Stack (right):**

* Contains 3+ tasks from Bronze-eligible projects  
* Visual treatment: Stacked cards with task icons, expandable  
* Represents operational execution  
* Three modes: Minimal (due dates only) / Target \+X (due dates \+ X discretionary) / Maximal (due dates \+ continuous queue pull)  
* Minimum 3 tasks enforced (can't activate priorities with fewer)

### **3.4.2 Dual Presence Pattern**

Work at Hand projects appear in two places simultaneously:

* Their slot on The Table (enhanced treatment)  
* Their home Category Card (standard Live treatment \+ subtle stream color pulse)

Both views render the same Project object. State changes update both automatically. This creates strong spatial awareness: you can see Gold project both in "current priorities" spotlight AND within "Health projects" context.

### **3.4.3 Empty Slots Philosophy**

Gold and Silver can be intentionally empty—this is valid strategic choice, not system failure. Reasons to leave empty:

* Building Bronze capability before tackling transformation  
* Current life season doesn't support major work  
* Recovering from period of over-commitment  
* Focusing all energy on one stream

Bronze must have minimum 3 tasks to activate priorities. This ensures directors always have concrete next actions.

---

## **3.5 The Two Queues**

### **3.5.1 Planning Queue**

**Location:** Top section of Drafting Room

**Purpose:** Temporary holding space for projects moving through creation stages 1-3

**Contents:**

* Projects in Stage 1 (Identified)  
* Projects in Stage 2 (Scoped)  
* Projects in Stage 3 (Drafted)

**Not in Planning Queue:**

* Projects that completed Stage 4 (moved to Priority Queue)  
* Projects on The Table (Work at Hand)  
* Completed or abandoned projects

**Typical state:** 0-3 projects. This is workspace, not storage. Projects move through relatively quickly (50 minutes total at normal pace), then graduate.

### **3.5.2 Priority Queue**

**Location:** Main section of Drafting Room

**Purpose:** Repository of fully-planned work ready to activate

**Contents:**

* Projects with Stage 4 complete (Plans)  
* Projects that were paused from Work at Hand (return to top of appropriate filter)

**Not in Priority Queue:**

* Projects still in Stages 1-3 (still in Planning Queue)  
* Projects currently on The Table (Work at Hand)  
* Completed projects

**Three filter views:**

* **Gold Candidates:** Initiative archetype, Major/Epic scale  
* **Silver Candidates:** System Build, Discovery Mission, capacity-building  
* **Bronze Candidates:** Quick Tasks, Micro scale, decomposed tasks

**Paused project behavior:** When project is paused, it jumps to top of appropriate filter automatically. This makes it easy to resume high-priority work.

---

# **SECTION 4: HOW THE PIECES MOVE**

*This section describes workflows: how Directors use the system, how projects move through states, and how the queues operate.*

---

## **4.1 The Execution Model**

### **4.1.1 Working on The Life Map**

Directors spend most of their time on the Life Map, working on active projects:

**Working from The Table:**

* Gold project (if active): Open Project Board, move tasks through kanban  
* Silver project (if active): Open Project Board, move tasks through kanban  
* Bronze tasks: Click to complete, new tasks auto-pull based on mode

**Working from Category Cards:**

* Can also access Gold/Silver projects through home category card (dual presence)  
* Can work on other Live projects not currently on The Table  
* Projects remain accessible whether or not they're current priorities

**Task Execution:**

* Open Project Board for any Live project  
* Drag tasks between To Do / In Progress / Done columns  
* Check tasks complete → moves to Done, progress ring fills  
* All tasks Done → Project automatically completes

**AI Worker Delegation:**

* From Project Board, click "Assign Tasks to Worker"  
* Select which tasks to delegate  
* Worker executes independently  
* Worker reports completion, Director reviews and approves

### **4.1.2 Planning When Needed**

Directors plan new work whenever it makes sense—when Table is empty, when ready to switch priorities, or after completing multiple projects.

**When to plan:**

* The Table is empty and you want to activate work  
* Current project completes and slot is available  
* You want to deliberately swap what you're focused on  
* You've created several new projects and want to prioritize them  
* Life circumstances change and current priorities no longer fit

**No required cadence:** Some Directors plan weekly (habit/rhythm), others plan monthly (slower project pace), others plan only when current work finishes (completion-driven). The system doesn't enforce any schedule.

**Typical planning session:**

**Step 1: Drafting Room \- Queue Management** (optional, 5-15 min)

* Review Planning Queue: Any stuck projects? Complete or abandon?  
* Review Priority Queue: Overall pipeline health? Category balance?  
* Create any new projects if inspired  
* Advance in-progress projects through remaining creation stages

**Step 2: Sorting Room \- Priority Selection** (5-15 min)

**Gold Candidate Selection:**

1. Click "Gold Candidates" filter  
2. View: Only Major Initiatives/Epic-scale projects (typically 2-8)  
3. Paused Gold projects appear at top (if any)  
4. Decide: Activate Gold or leave empty  
5. Key question: "Which frontier-opening work matters most right now?"

**Silver Candidate Selection:**

1. Click "Silver Candidates" filter  
2. View: Only System Builds, Discovery Missions, capacity-building (typically 5-15)  
3. Paused Silver projects appear at top (if any)  
4. Decide: Activate Silver or leave empty  
5. Key question: "Which infrastructure investment will buy the most future time?"

**Bronze Settings and Review:**

1. Click "Bronze Candidates" filter  
2. View: All Bronze tasks/micro-projects (typically 10-100+)  
3. Review which tasks have due dates (Minimal requirement)  
4. Count Minimal tasks (could be 3, could be 40\)  
5. Decide Bronze mode: Minimal, Target \+X, or Maximal  
6. If Target, choose X based on realistic capacity  
7. Reorder Bronze candidates if priorities shifted

**Step 2.5: Roster Room \- Worker Staffing** (optional, 10-20 min)

* Review newly activated Gold/Silver projects  
* Decide which projects need AI assistance  
* For each project requiring staffing:  
  * Run through 4-stage worker creation  
  * Finalize worker synopsis and prompt  
  * Officially staff the project  
* Can skip if projects don't need delegation  
* Can return anytime to staff as needs emerge

**Step 3: Activate selections**

* Review Gold/Silver selections and Bronze mode  
* Validate minimum 3 Bronze tasks  
* Click "Activate Priorities"  
* Return to Life Map to execute

### **4.1.3 Adapting Anytime**

**When circumstances change**, the system supports intelligent adaptation without waiting for any scheduled planning cycle:

**Pausing Projects:**

* From Project Board: Click "Pause" button in header  
* Project immediately: Exits The Table, returns to Priority Queue (top of appropriate filter), preserves kanban state and all progress, image retains Polish stage (doesn't regress)  
* Can activate different project immediately or leave slot empty

**Any-Time Project Creation:**

* Access Drafting Room anytime  
* Create project through 4-stage process  
* Can immediately activate to Table if urgent

**Any-time Project Activation:**

* When Gold or Silver slot empties (completes or pauses)  
* Director can immediately activate next Priority Queue candidate  
* No need to wait for any planning cycle

**Adjusting Bronze Mode:**

* Click Bronze settings gear on The Table  
* Change mode (Minimal / Target \+X / Maximal)  
* Adjust X value if in Target mode  
* Changes take effect immediately

---

## **4.2 Queue Workflows**

### **4.2.1 Two Queues Working Together**

**Planning Queue** \= Projects in development (Stages 1-3)

**Priority Queue** \= Ready work waiting for selection (Stage 4 complete)

The separation creates psychological safety: Capture ideas quickly (Stage 1, 2 minutes) without immediately prioritizing. Develop when ready. Only completed projects enter Priority Queue where they become priority decisions.

### **4.2.2 Planning Queue Workflows**

**Location:** Top section of Drafting Room

**What you can do:**

* Click any project → Resume work through creation stages with Marvin  
* Pause and return later (autosave preserves progress at each stage)  
* Abandon projects no longer relevant (delete from queue)  
* See at-a-glance: how many projects in development, which stages

**Typical state:** Most Directors have 0-3 projects here. Planning Queue is temporary workspace—projects move through relatively quickly, then graduate to Priority Queue.

**Queue Maintenance:**

* If Planning Queue grows to 5+ projects: Suggests review ("Want to clean up before adding more?")  
* For each stale project (\>2 weeks in same stage), Director chooses:  
  * Complete it now (accelerate through remaining stages)  
  * Abandon it (delete from queue)  
  * Keep it (still relevant, just not ready)

**Exit Conditions:**

* Projects exit Planning Queue when:  
  1. Stage 4 completes (move to Priority Queue)  
  2. Director abandons/deletes project

### **4.2.3 Planning with Priority Queue**

**How Filtering Works Technically:**

**Gold Candidates Filter logic:**

* Archetype \= Initiative AND scale ≥ Major, OR  
* Manual tag "Gold-eligible" (Director can override archetype classification)  
* Shows only Plans and Paused projects meeting these criteria  
* Paused Gold projects always appear at top of filtered view  
* Hides everything else temporarily

**Silver Candidates Filter logic:**

* Archetype \= System Build, OR  
* Archetype \= Discovery Mission, OR  
* Manual tag "capacity-building" or "Silver-eligible", OR  
* Traits indicate infrastructure/delegation/organization focus  
* Shows only Plans and Paused projects meeting these criteria  
* Paused Silver projects always appear at top of filtered view

**Bronze Candidates Filter logic:**

* Archetype \= Quick Task, OR  
* Scale \= Micro, OR  
* Source \= Decomposed from larger project, OR  
* Critical Response with Scale \= Micro or Minor  
* Shows all tasks and micro-projects meeting these criteria  
* Hides full projects

**Bronze Automatic Prioritization:**

Within Bronze candidates, tasks are ordered by:

1. Due date urgency (soonest first, imminent dates flagged)  
2. Manual priority (Director can reorder)  
3. Time estimate (quick tasks sometimes clustered)

Director can drag Bronze tasks up or down. This determines which tasks appear in Bronze stack when Target or Maximal modes activate.

### **4.2.4 Queue Maintenance**

**Planning Queue check (during planning sessions):**

* Any stuck projects? (been in Stage 2 for weeks?)  
* Complete or abandon projects no longer relevant  
* Advance promising projects through next stage if time available  
* Keep Planning Queue lean (0-3 projects typically)

**Priority Queue reordering (during planning sessions):**

* Does current order reflect priorities?  
* Should Paused projects (at top of filters) stay high or descend?  
* Approaching deadlines that should elevate priorities?  
* Category balance appropriate?  
* For Bronze: Due dates correct? Tasks that should be promoted to full projects?

**Continuous queue access:**

* Priority Queue updates dynamically (Paused projects jump to top)  
* Can access Drafting Room anytime for planning  
* Can reorder as priorities evolve

---

## **4.3 The Four-Stage Creation Process: From Idea to Plan**

Projects move through four creation stages in the Drafting Room with Marvin's assistance. Each stage has clear completion requirements before advancing.

### **4.3.1 Stage 1: Identified**

**Purpose:** Capture idea before it evaporates.

**Marvin asks:**

* "What's the project?" (title)  
* "Tell me a bit about it" (1-2 sentence description)  
* "Which Life Category?" (Health, Finances, Relationships, etc.)

**Example:**

* Title: "Kitchen Renovation"  
* Description: "Update kitchen with new cabinets, countertops, and appliances"  
* Category: Home & Environment

**Result:**

* Project created, enters Planning Queue  
* Status: "Stage 1 of 4 \- Identified"  
* Image: Sketch stage (light pencil outlines)  
* Can pause here for days or weeks OR continue immediately to Stage 2

**Key principle:** Ultra-low friction. Two minutes. If capture takes 20 minutes, ideas won't get captured.

### **4.3.2 Stage 2: Scoped**

**Purpose:** Define what success looks like before thinking about tasks.

**Marvin asks:**

* "What are the objectives?" (1-3 specific outcomes)  
* "When does this need to be done?" (deadline if applicable)  
* "What type of project is this?" (archetype selection)  
* "How would you characterize it?" (trait values)

**Example:**

* Objectives:  
  1. Install new cabinets with soft-close drawers  
  2. Replace laminate countertops with quartz  
  3. Upgrade to energy-efficient appliances  
* Deadline: "Before holidays" (3 months)  
* Archetype: Initiative  
* Traits: Scale=Major, Urgency=Medium, Importance=High, Complexity=Complex, Uncertainty=Some Unknowns

**Marvin's role:**

* Reflects understanding: "So you want a functional, modern kitchen ready for holiday hosting?"  
* Suggests trait values based on archetype: "Initiatives are typically Moderate to Epic scale..."  
* Asks clarifying questions: "Will you hire contractors or DIY?"  
* Validates achievability without being prescriptive

**Result:**

* Objectives defined, archetype set, traits established  
* Image continues evolution: Foundation (dark base layer)  
* Status: "Stage 2 of 4 \- Scoped"  
* Can pause here or continue to Stage 3

**Key principle:** Clarity before execution. Know what "done" looks like before planning how to get there.

### **4.3.3 Stage 3: Drafted**

**Purpose:** Generate complete task list that will populate kanban board when activated.

**Marvin generates initial task list:**

* Based on objectives from Stage 2  
* Based on archetype patterns (Initiatives need certain task types)  
* Balanced across CODAD framework (Connect/Operate/Discover/Advance/Design)  
* Sequenced by dependencies and optimal order

**Example Marvin presents:** "Based on your kitchen renovation objectives, here's a suggested task list (18 tasks):

1. Research cabinet styles and prices  
2. Get quotes from 3 cabinet installers  
3. Research quartz countertop options  
4. Visit showroom to see samples  
5. Measure countertop dimensions  
6. Get quotes from 3 countertop fabricators  
7. Research energy-efficient appliance models  
8. Compare appliance prices across retailers  
9. Create detailed budget spreadsheet  
10. Select cabinet style and vendor  
11. Select countertop material and fabricator  
12. Select and order appliances  
13. Schedule cabinet installation  
14. Schedule countertop templating  
15. Schedule countertop installation  
16. Schedule appliance delivery  
17. Coordinate installation timing  
18. Final walkthrough and punch list"

**Director iteration:**

* Review list: "Add, remove, reorder anything?"  
* Director: "I already have a cabinet vendor, so skip \#1 and \#2"  
* Marvin removes, adjusts sequence  
* Director: "Add task: 'Remove old appliances and dispose'"  
* Marvin adds at appropriate position  
* Continue iterating until Director approves

**Marvin checks CODAD balance:** "Your task list has: 6 Discover, 4 Operate, 3 Connect, 3 Advance, 2 Design. Good balance—you'll research thoroughly, coordinate effectively, and execute decisively."

**Marvin creates tasks:** All approved tasks created in system, ready to populate kanban board when project activates. No commitment until Director approves.

**Result:**

* Complete task list (will populate kanban board when activated)  
* Image continues evolution: Color Emergence (muted category colors seep in)  
* Status: "Stage 3 of 4 \- Drafted"  
* Can pause here or continue to Stage 4

**Key principle:** When this project activates, these tasks populate the kanban board. Work begins immediately. No wondering "what do I actually do?"

### **4.3.4 Stage 4: Prioritized**

**Purpose:** Decide where this project ranks relative to existing priorities.

**Marvin asks:** "Where should this fit in your Priority Queue?"

**Process:**

1. Marvin shows current Priority Queue (appropriate filter based on archetype)  
2. If Initiative/Major: Shows Gold Candidates  
3. If System Build/Discovery: Shows Silver Candidates  
4. If Quick Task/Micro: Shows Bronze Candidates  
5. Director drags new project to desired position  
6. Marvin: "This will be \#3 in your Gold candidates. Confirm?"  
7. Director: "Confirmed" or adjusts position

**Result:**

* Project exits Planning Queue  
* Project enters Priority Queue at specified position  
* Status: "Stage 4 of 4 \- Prioritized" (also labeled "Plans")  
* Image retains Color Emergence stage  
* Ready to activate whenever Director returns to Sorting Room

**Key principle:** Prioritization happens AFTER planning is complete. This prevents the pressure of "should I do this?" from interfering with the clarity of "what would this entail?"

---

## **4.4 Work at Hand Activation and Management**

### **4.4.1 Activation**

**From Priority Queue to The Table:**

When ready to activate new priorities:

1. Director enters Sorting Room  
2. Views Gold Candidates filter  
3. Selects Gold project (or leaves empty)  
4. Views Silver Candidates filter  
5. Selects Silver project (or leaves empty)  
6. Configures Bronze mode  
7. Validates minimum 3 Bronze tasks  
8. Clicks "Activate Priorities"

**On activation:**

**Selected Gold project (if any):**

* Status changes to "work\_at\_hand"  
* tablePosition \= "gold"  
* Image evolves to Polish stage (vibrant colors, glossy finish)  
* Tasks populate kanban board  
* Appears on Table \+ home Category Card (dual presence)

**Selected Silver project (if any):**

* Status changes to "work\_at\_hand"  
* tablePosition \= "silver"  
* Image evolves to Polish stage  
* Tasks populate kanban board  
* Appears on Table \+ home Category Card (dual presence)

**Bronze tasks:**

* Tasks display in Bronze stack based on mode  
* Minimal mode: Only due dates and Critical Response  
* Target mode: Minimal \+ X discretionary from queue  
* Maximal mode: Minimal \+ continuous queue pull

**Director returns to Life Map** ready to execute.

### **4.4.2 Working Projects**

**From The Table:**

* Click Gold/Silver project card → Project Board opens  
* See kanban board with all tasks  
* Drag tasks: To Do → In Progress → Done  
* Progress ring fills as tasks complete  
* Close Project Board (ESC or click outside) → return to Life Map

**From Category Cards:**

* Gold/Silver projects also visible in home category (dual presence)  
* Can access Project Board from either location  
* Both views show same object, same progress

**Bronze task completion:**

* Click task on Bronze stack → marks complete  
* Task moves off stack  
* Based on mode:  
  * Minimal: Stack shrinks (no replacement)  
  * Target \+X: Next Priority Queue task auto-pulls  
  * Maximal: Continuous queue pull maintains capacity

### **4.4.3 Completing Projects**

**Automatic completion:**

* When last task moves to Done → Project status changes to "completed"  
* Project automatically: Exits The Table, exits all queues, image evolves to Decoration stage (gold/silver accents)  
* Gold/Silver slot now empty (ready for new activation)

**Manual completion:**

* If tasks aren't comprehensive but project is done: Click "Mark Complete" button  
* Director confirms: "Some tasks incomplete. Mark project complete anyway?"  
* Same result: Project completes, exits Table

**Post-completion:**

* Completed projects no longer visible (MVP simplification)  
* Future: Archives Workspace will store completion history

### **4.4.4 Pausing Projects**

**From Project Board:**

* Click "Pause" button in header  
* Confirm: "Pause this project and return to Priority Queue?"

**Immediate effects:**

* Project exits The Table (slot now empty)  
* Status changes to "paused"  
* Returns to Priority Queue at top of appropriate filter  
* Image retains Polish stage (doesn't regress)  
* All kanban state preserved (tasks stay in columns)  
* All Worker assignments preserved

**Why pause:**

* Circumstances changed, no longer priority  
* Need focus on different work  
* Realized project needs rethinking  
* Emergency arose requiring attention elsewhere

**Resuming paused projects:**

* Project sits at top of appropriate filter in Priority Queue  
* Next time Director activates priorities, can select paused project  
* All progress intact, pick up where left off

---

## **4.5 Worker Staffing Workflow**

**When to staff:** After activating Gold or Silver projects on The Table, before beginning task execution. Can also staff mid-project when delegation needs become clear.

**The guided 4-stage process** mirrors project creation but focuses on defining the AI Worker who'll help execute:

### **4.5.1 Stage 1: Project Review**

**Purpose:** Devin reviews project context to understand staffing needs.

**Devin presents:**

* Project title, objectives, and key outcomes  
* Task breakdown with types (CODAD analysis)  
* Project archetype and scale  
* Estimated timeline and complexity

**Devin asks:** "I see this is a \[archetype\] project with \[X\] tasks spanning \[timeframe\]. I'm thinking about what kind of Worker would be most helpful here. Does this look right?"

**Director confirms** or provides additional context about delegation intentions.

**Result:**

* Shared understanding of project scope  
* Identified delegation opportunities  
* Ready to design worker profile

### **4.5.2 Stage 2: Worker Profile Drafting**

**Purpose:** Create a worker synopsis that captures role, capabilities, and approach.

**Devin suggests:** Based on project analysis, Devin drafts a worker synopsis (150-300 words):

* Worker role and primary responsibilities  
* Key capabilities required for this project  
* Work style and communication approach  
* Domain expertise needed  
* How they'll collaborate with Director

**Example synopsis:**

"**Research & Analysis Specialist** for the Standing Desk Evaluation project. This Worker specializes in product research, comparative analysis, and evidence-based recommendations. They'll handle the discovery tasks (researching options, comparing features, reading reviews) and synthesize findings into clear decision frameworks. Communicates in concise bullet points with source citations. Proactively flags important considerations and trade-offs without being prescriptive. Hands off to you for final decisions but ensures you have complete information."

**Interaction:**

* Devin presents draft synopsis  
* Director edits directly (like editing project description)  
* Can request templates: "Show me your Content Creator template"  
* Can reference past workers: "Similar to the researcher from my last project"

**Result:**

* Finalized worker synopsis  
* Clear role definition  
* Ready for prompt generation

### **4.5.3 Stage 3: Prompt Configuration**

**Purpose:** Generate the actual AI prompt that will govern worker behavior.

**Devin generates initial prompt:** Based on the approved synopsis, Devin creates a detailed prompt (500-1000 words) including:

* Core identity and role  
* Specific capabilities and constraints  
* Communication style and formatting preferences  
* Task execution methodology  
* Quality standards and checkpoints  
* How to handle edge cases  
* Collaboration protocols with Director

**Devin presents:** "Here's the prompt I've drafted. I've focused on \[key aspects\]. The prompt emphasizes \[specific behaviors\]. Want to review and refine?"

**Director can:**

* Edit prompt directly (full text editing)  
* Request adjustments: "Make them more proactive about suggesting alternatives"  
* Test specifics: "How would they handle a task with ambiguous requirements?"  
* Regenerate sections: "Rewrite the communication style part"

**Bidirectional editing:**

* If Director edits synopsis → Devin offers to regenerate prompt to match  
* If Director edits prompt → Devin checks if synopsis should update  
* Maintains alignment between high-level description and detailed instructions

**Result:**

* Complete, tested worker prompt  
* Aligned synopsis and prompt  
* Ready to activate worker

### **4.5.4 Stage 4: Confirmation & Staffing**

**Purpose:** Officially assign the worker to the project.

**Devin confirms:**

* Worker name/title  
* Final synopsis (what Director will see)  
* Key responsibilities  
* Which project they're joining

**Devin asks:** "Ready to add \[Worker Name\] to the \[Project Name\] team?"

**Director:** "Yes, staff them"

**Result:**

* Worker created and linked to project  
* Worker appears in Project Board "Team" section  
* Worker available for immediate task assignment  
* Can access Roster Room to modify worker at any time

**Special note:** Unlike project creation, staffing can happen mid-project if Director realizes they need delegation help partway through execution.

---

# **SECTION 5: SYSTEM CONSTRAINTS**

*These are non-negotiable rules that protect the integrity of the LifeBuild model.*

---

## **5.1 Project Stage Progression**

**Rule:** Projects MUST progress through stages sequentially: 1 → 2 → 3 → 4

**Enforcement:**

* Cannot skip stages (e.g., cannot go 1 → 3\)  
* Cannot regress stages once completed  
* Stage transitions triggered only by explicit user completion action  
* Stage completion requirements must be validated before allowing progression

**Stage Completion Requirements:**

* Stage 1 → Stage 2: Requires title, description, category (all fields validated, none empty)  
* Stage 2 → Stage 3: Requires ≥1 objective, archetype selected, all 5 traits set  
* Stage 3 → Stage 4: Requires ≥1 task created and approved by Director  
* Stage 4 → Work at Hand: Requires selection in Sorting Room \+ activation confirmation

## **5.2 Table Constraints**

**Rule:** Max 1 Gold project simultaneously (hard limit)

**Enforcement:**

* Only Gold-eligible projects can occupy Gold slot (Initiative archetype, scale ≥ Major)  
* Attempting to add 2nd Gold project → system blocks \+ shows message  
* Empty slot is valid state (strategic choice)

**Rule:** Max 1 Silver project simultaneously (hard limit)

**Enforcement:**

* Only Silver-eligible projects can occupy Silver slot (System Build, Discovery Mission, capacity-building)  
* Attempting to add 2nd Silver project → system blocks \+ shows message  
* Empty slot is valid state (strategic choice)

**Rule:** Min 3 Bronze tasks to activate priorities (hard requirement)

**Enforcement:**

* Cannot activate priorities unless bronzeStack.length \>= 3  
* Sorting Room validates this constraint before allowing "Activate Priorities"  
* If constraint fails: System blocks activation \+ provides clear message \+ suggests creating Bronze tasks

**Rule:** No duplicate work on The Table

**Enforcement:**

* Same project cannot occupy both Gold and Silver slots  
* Same project cannot appear in both slot and Bronze stack  
* System validates at activation confirmation  
* Duplicate attempt → system blocks \+ shows message

## **5.3 Queue Exclusivity**

**Rule:** Projects exist in ONE queue at a time (Planning XOR Priority)

**Enforcement:**

* Stages 1-3: Project in Planning Queue  
* Stage 4 complete: Project exits Planning Queue, enters Priority Queue  
* Work at Hand: Project exits Priority Queue (not in any queue)  
* Paused: Project returns to Priority Queue (top of appropriate filter)  
* Completed: Project exits all queues

**Rule:** Cannot be in multiple places simultaneously (except dual presence)

**Enforcement:**

* Project cannot be in Planning Queue AND Priority Queue  
* Project cannot be in queue AND on The Table (except via dual presence rendering)  
* Orphaned projects (no queue) only exist in completed state

## **5.4 Category Assignment**

**Rule:** Every project has exactly 1 category

**Enforcement:**

* Category required at Stage 1 (cannot create project without selecting category)  
* Cannot be orphaned (category field cannot be null)  
* Cannot change category after creation (in MVP \- this is a simplification)  
* Category determines which Category Card displays the project

## **5.5 Bronze Mode Behaviors**

**Rule:** Bronze mode determines task replacement logic

**Enforcement:**

**Minimal Mode:**

* Only due dates \+ Critical Response populate Bronze stack  
* Task completion → stack shrinks, no replacement  
* Stack size varies naturally

**Target \+X Mode:**

* Due dates \+ Critical Response \+ X discretionary tasks from Priority Queue  
* Task completion → next Priority Queue task auto-pulls to maintain stack size  
* X value set by Director at activation, can adjust anytime

**Maximal Mode:**

* Due dates \+ Critical Response \+ continuous Priority Queue pull  
* Task completion → always pulls next highest-priority Bronze task  
* Stack size grows as long as Priority Queue has Bronze candidates

## **5.6 Worker Assignment Rules**

**Rule:** One worker per project (MVP constraint)

**Enforcement:**

* Project.assignedWorker can be null or single Worker ID  
* Cannot assign multiple Workers to same project in MVP  
* Worker cannot be assigned to multiple projects  
* Worker assignment persists until project completion or explicit removal

**Rule:** Workers bound to projects, not tasks directly

**Enforcement:**

* Workers exist at project level  
* Tasks are assigned to Workers through project relationship  
* Worker can see all project tasks but only executes assigned ones  
* When project completes, Worker is archived with project

**Rule:** Worker modifications must go through Roster Room

**Enforcement:**

* Synopsis and Prompt are immutable outside Roster Room  
* "Edit Worker" button redirects to Roster Room  
* Devin mediates all worker modifications  
* No direct worker prompt editing from Project Board

---

# **SECTION 6: TECHNICAL ARCHITECTURE**

*This section provides technical guidance for implementation without prescribing specific technologies.*

---

## **6.1 Data Architecture Principles**

**Single Source of Truth:**

* Project object is canonical  
* The Table slots, Category Cards, queues all reference same Project instances  
* UI updates propagate from Project status changes, not duplicated state  
* No data synchronization needed between views—all read from same source

**Reactive Updates:**

* When Project.status changes → all UI views update automatically  
* When Task.status changes → Project.progressPercent recalculates → progress ring updates  
* When Bronze mode changes → Bronze stack repopulates immediately  
* State machine enforcement at database level, not just UI validation

**State Machine Enforcement:**

* Project status transitions must follow valid paths (defined in Section 5.1)  
* Cannot skip stages, cannot regress stages  
* Transitions enforced at database/backend level with validation  
* Invalid transitions rejected before reaching UI

**Queue Exclusivity Constraints:**

* Database constraint: Project cannot have both inPlanningQueue=true AND inPriorityQueue=true  
* Work at Hand projects have both queue flags=false  
* Completed projects have both queue flags=false  
* Orphaned projects (no queue, not Work at Hand, not Complete) should be impossible state

## **6.2 Critical Performance Considerations**

**Real-Time Project Board Updates:**

* Kanban column changes must feel instant (\<100ms)  
* Progress ring updates must be immediate (\<50ms)  
* Consider optimistic UI updates with backend sync

**Efficient Category Card Aggregation:**

* Category Cards aggregate all projects in category (could be 30+ projects)  
* Need efficient queries: SELECT \* FROM projects WHERE category\_id \= X AND status IN (work\_at\_hand, live, plans, paused)  
* Consider caching category counts to avoid repeated aggregation queries

**Priority Queue Filtering Performance:**

* Three-stream filtering operates on potentially 100+ projects/tasks  
* Need indexed queries on archetype, scale, status  
* Consider materialized views or denormalized filter eligibility flags

**Image Asset Management:**

* Urushi images at 5 evolution stages per project  
* Could be 100+ project images loaded on Life Map Overview  
* Need: lazy loading, progressive enhancement, optimized image formats  
* Consider: rendering images on-demand vs. pre-generating all stages

## **6.3 Dual Presence Rendering**

**How to implement:**

* Work at Hand projects appear on The Table AND home Category Card  
* Both views render the same Project object  
* The Table: Enhanced visual treatment (enhanced glow, breathing animation, stream color)  
* Category Card: Standard Live treatment (full saturation, standard glow, progress ring) \+ subtle pulse matching stream color

**Technical approach:**

* Single Project component that accepts displayContext prop: "table" | "category"  
* Component adjusts visual treatment based on context  
* Both contexts subscribe to same Project state  
* State change → both views update automatically

## **6.4 Future-Proofing Considerations**

**Where full SOT features will plug in later:**

**Strategic Planning Layer (Excluded from MVP):**

* Council Chamber room UI (Jarvis conversations)  
* Director Attributes tracking (Energy Reserve, Processing Power, Agency, Momentum, Support Infrastructure)  
* Personal Charter (vision, values, strategic themes)  
* Quarterly goals and milestone tracking  
* Category Advisor rooms (8 specialized AI agents)

**Data structures to accommodate:**

* Add fields: Project.quarterlyGoalId, Project.strategicThemeId (nullable)  
* Add tables: DirectorAttributes, Charter, QuarterlyGoals, Milestones  
* Add agent conversation logging infrastructure

**Archives Workspace (Excluded from MVP):**

* Conan the Librarian agent  
* Historical repository with search  
* Performance metrics and trend analysis  
* Pattern recognition system

**Data structures to accommodate:**

* Don't delete completed projects—archive them  
* Add fields: Project.completedAt, Project.actualTimeSpent, Project.lessonsLearned  
* Add tables: ArchivedProjects, CompletionMetrics, Patterns

**Sophisticated AI Behavior (Excluded from MVP):**

* Agent personality development  
* Pattern recognition and learning  
* Proactive suggestions  
* Agent-to-agent coordination  
* Memory building across sessions

**Data structures to accommodate:**

* Add tables: AgentMemory, AgentLearning, DirectorPatterns  
* Add fields: Project.marvinSuggestionQuality, Project.directorFeedback

**Advanced Delegation (Excluded from MVP):**

* Human delegation configuration  
* Automation setup for recurring work  
* Multi-agent teams with coordination  
* Worker performance tracking  
* Maintenance Loops (recurring tasks that auto-plant)

**Data structures to accommodate:**

* Modify: Project.assignedWorker → Project.assignedWorkers (one-to-many)  
* Add fields: Worker.teamRole, Worker.coordinatesWith, Worker.performanceMetrics  
* Add tables: HumanDelegates, RecurringTasks, WorkerPerformance, WorkerInteractions  
* Add fields: Task.recurringPattern, Task.delegatedToHuman

**Structured Rhythms (Excluded from MVP):**

* Optional weekly/monthly planning prompts  
* Sprint retrospectives  
* Quarterly review ceremonies  
* Goal milestone tracking

**Data structures to accommodate:**

* Add tables: PlanningRhythms, Retrospectives, MilestoneProgress  
* Add fields: Director.preferredPlanningCadence, Project.sprintId

## **6.5 What's Intentionally Simplified for MVP**

**No WIP Limits Enforcement:**

* System suggests 3-task In Progress focus (visual cue)  
* But doesn't block exceeding 3 tasks (Director can override)  
* Post-MVP: Could add hard WIP limits as configurable setting

**No Maintenance Loops:**

* Bronze tasks are manually created or come from projects  
* No automated recurring task planting  
* Post-MVP: System Builds can generate Maintenance Loops that auto-plant Bronze tasks

**No Agent Learning:**

* AI Workers execute assigned tasks, don't learn patterns  
* Marvin doesn't improve suggestions based on Director feedback  
* No memory building across sessions  
* Post-MVP: Agent learning and pattern recognition layer

**No Category Advisors:**

* Only Marvin (Drafting Room), Cameron (Sorting Room), and Devin (Roster Room) present in MVP  
* No specialized domain advisors (Maya, Atlas, Brooks, etc.)  
* Post-MVP: 8 Category Advisors with domain expertise

**No Human Delegation:**

* Only AI Worker delegation in MVP  
* No configuration for delegating to family/team members  
* Post-MVP: Human delegation tracking and coordination

**No Structured Rhythms:**

* No enforced planning cadence (Director chooses when to plan)  
* No formal ceremonies or rituals  
* Post-MVP: Optional structured rhythms for Directors who want them (weekly reviews, monthly planning, quarterly goals)

---

# **APPENDICES**

## **Appendix A: Glossary**

**AI Worker** \- Custom-created agent assigned to specific projects who executes delegated tasks independently. Each Worker has a synopsis (high-level role description) and prompt (detailed behavioral instructions) crafted collaboratively between Director and Devin in the Roster Room. Workers persist with their project until completion. MVP supports one Worker per project.

**Archetype** \- Classification describing a project's fundamental nature: Initiative, System Build, Discovery Mission, Quick Task, or Critical Response.

**Bronze** \- Operational work stream on The Table. Contains 3+ tasks for necessary operational execution. Three modes: Minimal, Target \+X, Maximal.

**Cameron** \- AI assistant in Sorting Room who guides priority selection through three-stream filtering.

**Category** \- One of eight major life domains that organize projects: Health, Purpose, Finances, Relationships, Home, Community, Leisure, Personal Growth.

**Category Card** \- UI container on Life Map showing all projects within one life domain. Displays Work at Hand, Live, Plans, and Paused projects.

**CODAD Framework** \- Task type classification: Connect, Operate, Discover, Advance, Design. Helps create balanced task lists.

**Devin** \- AI assistant in Roster Room who guides Worker creation through 4-stage staffing process and maintains worker templates.

**Director** \- The person who logs into LifeBuild.me to manage their personal life. Decision-maker, strategist, and executor.

**Domain Altitude** \- Navigation level where single category fills 80% of screen, showing all projects in that domain in detail.

**Drafting Room** \- Project Management Room where Directors create projects through 4-stage process and manage Planning/Priority Queues with Marvin's assistance.

**Dual Presence** \- Pattern where Work at Hand projects appear in two places simultaneously: The Table \+ home Category Card. Same object rendered in both locations.

**Execution Altitude** \- Navigation level where Project Board overlay opens, displaying kanban board for task execution.

**Gold** \- Transformative work stream on The Table. One slot for frontier-opening initiatives. Can be strategically empty.

**Kanban Board** \- Three-column task board (To Do | In Progress | Done) that appears in Project Board overlay for task execution.

**Life Map** \- Primary execution workspace where Directors spend 90% of their time working on projects. Contains The Table \+ 8 Category Cards.

**Live** \- Project status for currently active projects that aren't Work at Hand. Can be worked on anytime, just not current priority.

**Marvin** \- AI assistant in Drafting Room who guides project creation and task list generation.

**Overview Altitude** \- Default Life Map view showing all 8 Category Cards \+ The Table. Scan entire life at a glance.

**Paused** \- Project status for temporarily stopped projects. Automatically returns to top of Priority Queue in appropriate filter. State preserved.

**Plans** \- Project status after Stage 4 completion. Fully planned, never activated before, waiting in Priority Queue for activation.

**Planning** \- Project status while moving through Stages 1-3 of creation. Lives in Planning Queue, not ready to activate yet.

**Planning Queue** \- Temporary workspace in Drafting Room top section holding projects moving through Stages 1-3. Typically 0-3 projects.

**Priority Queue** \- Main section of Drafting Room displaying all fully-planned work (Stage 4 complete) ready to activate. Has three-stream filtering.

**Progress Ring** \- Colored border around project card that fills clockwise as tasks complete. Visual feedback on completion status.

**Project Board** \- Overlay that opens at Execution Altitude showing project header \+ kanban board \+ AI Worker assignment.

**Roster Room** \- Project Management Room where Directors create custom AI Workers for projects through guided 4-stage staffing workflow.

**Silver** \- Infrastructure work stream on The Table. One slot for capability-building work. Can be strategically empty.

**Sorting Room** \- Project Management Room where Directors select current priorities through three-stream filtering. Accessed whenever Director wants to change what's on The Table.

**Staffing** \- The complete process of creating and assigning an AI Worker to a project, streamlined into a single-sitting workflow.

**The Table** \- Persistent spotlight at top of Life Map showing current priorities across three streams: Gold, Silver, Bronze. Updated whenever Director activates new work.

**Three-Stream Filtering** \- Priority Queue view modes: Gold Candidates, Silver Candidates, Bronze Candidates. Helps Directors focus on one type of work at a time.

**Urushi Evolution** \- Five-stage visual progression for projects: Sketch → Foundation → Color Emergence → Polish → Decoration. Inspired by Japanese lacquerware.

**Work at Hand** \- Project status for current priorities actively on The Table. Enhanced visual treatment, appears in two places (Table \+ Category Card).

**Worker Prompt** \- 500-1000 word system-level instructions that govern Worker behavior. Generated from synopsis, editable in Roster Room.

**Worker Synopsis** \- 150-300 word Director-facing description of a Worker's role, capabilities, and approach. Editable in Roster Room.

**Worker Template** \- One of 10 pre-configured Worker profiles maintained by Devin for common delegation needs. Starting points for custom worker creation.

---

## **Appendix B: User Scenarios**

### **Scenario 1: First-Time Director \- Getting Started**

**Day 1 \- Initial Setup:**

Sarah logs into LifeBuild for the first time. She sees the Life Map with The Table (empty) at top and 8 empty Category Cards below.

She clicks "Get Started" and is guided to Drafting Room. With Marvin's help:

**Creates "Start Morning Exercise Routine" (Health category):**

* Stage 1 (2 min): Title, description, category  
* Stage 2 (10 min): Objectives, System Build archetype, traits  
* Stage 3 (30 min): Marvin generates 8 tasks, Sarah refines  
* Stage 4 (5 min): Places in Silver Candidates position \#1

**Creates "Organize Home Office" (Home category):**

* Completes all 4 stages (50 min total)  
* Places in Silver Candidates position \#2

**Creates "Schedule Dentist Appointment" (Health category):**

* Quick Task archetype  
* Marvin suggests keeping it simple (5 min total)  
* Goes to Bronze Candidates

**When Ready to Activate Work:**

Sarah visits Sorting Room:

* Reviews Priority Queue: 2 Silver projects, 1 Bronze task  
* Leaves Gold empty (strategically \- wants to build foundation first)  
* Selects "Start Morning Exercise Routine" for Silver  
* Sets Bronze to Minimal mode (only has 1 due-date task)  
* Needs 2 more Bronze tasks minimum

Returns to Drafting Room:

* Creates "Pay Utility Bills" (Finances) \- Quick Task  
* Creates "Respond to Mom's Email" (Relationships) \- Quick Task  
* Both go to Bronze Candidates

Returns to Sorting Room:

* Now has 3 Bronze tasks  
* Clicks "Activate Priorities"  
* Returns to Life Map

**Executing Priorities:**

Life Map now shows:

* The Table: Silver slot with "Start Morning Exercise," Bronze stack with 3 tasks  
* Health Category Card: Shows same "Morning Exercise" project \+ "Dentist" task  
* Home Category Card: Shows "Organize Office" as Plans (dimmed)  
* Finances Category Card: Shows "Pay Bills" task  
* Relationships Category Card: Shows "Email Mom" task

Sarah clicks "Start Morning Exercise" from Table → Project Board opens:

* Sees 8 tasks in To Do column  
* Moves "Research 10-minute workout videos" to In Progress  
* Completes it, moves to Done  
* Progress ring fills 12% (1 of 8 tasks)

Continues working, completes 5 of 8 tasks over the next several days. Good progress for first project.

### **Scenario 2: Experienced Director \- Pausing and Adapting**

**Starting Priorities:**

Marcus begins with:

* Gold: "Launch Photography Side Business" (Major Initiative, Week 3 of 8\)  
* Silver: "Build Automated Bill Payment System" (System Build, Week 2 of 3\)  
* Bronze: 12 tasks (Target \+4 mode)

He opens "Launch Photography Side Business" Project Board, moves tasks through kanban, makes good progress Monday and Tuesday.

**Wednesday Crisis:**

Marcus's mom calls \- she fell and broke her hip. He needs to handle medical logistics, coordinate care, and be available for family.

**Immediate Adaptation:**

Opens "Launch Photography Side Business" Project Board → Clicks "Pause" → Confirms

Opens "Build Automated Bill Payment System" Project Board → Clicks "Pause" → Confirms

Both projects:

* Exit The Table (now empty)  
* Return to Priority Queue at top of appropriate filters  
* All progress preserved, images stay Polish stage

Clicks Bronze settings gear → Changes from Target \+4 (12 tasks) to Minimal (3 tasks)

* 9 discretionary tasks return to Priority Queue  
* Only keeps 3 highest-priority due-date tasks

**Creating Emergency Response:**

Accesses Drafting Room → "Create Emergency Project"

Marvin switches to fast mode:

* Stage 1 (2 min): "Mom's Hip Surgery Coordination"  
* Stage 2 (3 min): Critical Response archetype, objectives suggested  
* Stage 3 (5 min): Marvin generates emergency task list from templates  
* Stage 4 (2 min): "Should this activate immediately?"

Marcus: "Yes, put it in Silver"

**New Priority State:**

Life Map now shows:

* Gold: Empty (strategically)  
* Silver: "Mom's Hip Surgery Coordination" (emergency)  
* Bronze: 3 minimal tasks

Marcus works on this for two weeks, completes the emergency project.

**Resuming Normal Work:**

Returns to Sorting Room when ready:

* Views Silver Candidates  
* Both paused projects at top: "Photography Business" and "Bill Payment System"  
* Selects "Photography Business" for Gold (promotes from Silver to Gold)  
* Selects "Bill Payment System" for Silver (resumes where it was)  
* Changes Bronze back to Target \+4  
* Activates priorities

Both projects resume exactly where he left off. No progress lost, no rework needed.

### **Scenario 3: Worker Staffing for Complex Project**

**Starting Point:**

Lisa has activated "Research Investment Strategy" (Discovery Mission) in her Silver slot. Looking at the 15-task Project Board, she realizes the research tasks are perfect for AI delegation.

**Entering Roster Room:**

Clicks "Assign Workers" in Project Board → Opens Roster Room → Devin appears

**Stage 1: Project Review**

Devin: "Let's look at your 'Research Investment Strategy' project. I see 15 tasks:

* 6 Discover tasks (researching index funds, comparing brokerages, reading investment guides)  
* 4 Design tasks (creating comparison spreadsheets, drafting strategy outline)  
* 3 Connect tasks (scheduling financial advisor consultation)  
* 2 Advance tasks (opening brokerage account, initial investment)

This is a research-heavy Discovery Mission. The delegation opportunity is strong—those 6 Discover tasks and 4 Design tasks could be handled by a Research Specialist. Sound right?"

Lisa: "Yes, exactly. I want help with the research and analysis, but I'll handle the final decisions and account opening."

**Stage 2: Worker Profile**

Devin drafts synopsis:

"**Investment Research Specialist** for the Research Investment Strategy project. This Worker excels at financial research, comparative analysis, and investment strategy evaluation. They'll handle discovery tasks (researching index fund options, comparing brokerage features, analyzing historical returns) and create decision-making frameworks (comparison spreadsheets, pros/cons analyses, strategic recommendations). Communicates in data-driven summaries with clear trade-offs. Maintains objectivity—presents information without pushing specific choices. Flags important considerations like fees, tax implications, and risk profiles. Hands final decisions to you after ensuring complete information landscape."

Lisa reviews: "This is perfect. Maybe add that they should prioritize low-cost index funds and tax-advantaged accounts?"

Devin updates synopsis: "Added preferences for low-cost approaches and tax optimization focus."

**Stage 3: Prompt Configuration**

Devin generates 800-word prompt covering:

* Core identity as research specialist  
* Financial research methodology  
* How to present comparative analyses  
* Communication style (data tables, bullet summaries)  
* Constraints (never give specific investment advice, always show trade-offs)  
* Emphasis on low-cost index funds and tax-advantaged accounts  
* Collaboration protocol (complete research → summarize → present → await Director's decision)

Lisa reviews prompt, edits one section: "When presenting options, rank by Lisa's stated priorities: lowest fees first, then historical performance, then ease of use."

Devin: "Good refinement. This ensures the Worker understands your decision framework. Updated the prompt's prioritization section."

**Stage 4: Confirmation**

Devin: "Here's what we have:

* Worker: Investment Research Specialist  
* Role: Handle 10 research and analysis tasks  
* Approach: Data-driven, objective, low-cost focused  
* Project: Research Investment Strategy

Ready to add this Worker to your team?"

Lisa: "Yes, staff them."

**Immediate Result:**

Returns to Project Board for "Research Investment Strategy"

* Team section now shows: "Investment Research Specialist" with avatar  
* Lisa clicks first Discover task → "Assign to Worker" → Selects Investment Research Specialist  
* Repeats for 9 more research/analysis tasks  
* Keeps 5 decision/action tasks for herself

**Over Next Week:**

Worker completes research tasks:

* Creates comparison spreadsheet of index fund options  
* Writes summary of brokerage features  
* Analyzes tax-advantaged account types  
* Each completion appears in Lisa's "Review" queue

Lisa reviews each deliverable:

* Approves comparison spreadsheet (moves to Done)  
* Requests revision on brokerage analysis: "Add info about transfer fees"  
* Worker updates and resubmits  
* Lisa approves

**Two Weeks Later:**

Lisa has used Worker's research to make informed decisions, opened account, made initial investment. Project completes. Worker archived with project.

Next time Lisa has a research project, she can reference this Worker: "Similar to my Investment Research Specialist from last time."

