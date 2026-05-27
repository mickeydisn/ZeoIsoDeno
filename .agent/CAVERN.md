| # | Name | Example |
|---|------|---------|
| 1 | Inline Flow | `login -> auth -> home` |
| 2 | Branch Fork | `valid? yes -> save`<br>`      no  -> warn` |
| 3 | Layered Stack | `UI`<br>`──`<br>`Logic`<br>`──`<br>`DB` |
| 4 | Actor Message | `Client(edit) -> Worker(save) -> Client(sync)` |
| 5 | Tree Scope | `App`<br>`├─ Auth(login, logout)`<br>`└─ Data(fetch, sync)` |
| 6 | Parallel Split | `      ┌─ mail`<br>`save ──┤`<br>`      └─ log` |
| 7 | Loop Cycle | `fetch -> process -> emit`<br>`  └──────────────┘` |
| 8 | Diff Patch | `user {`<br>` -name`<br>` +username`<br>`}` |
| 9 | Pipe Chain | `raw \| clean \| shape \| store` |
| 10 | Fallback Chain | `cache`<br>`  ?? db`<br>`  ?? default` |
| 11 | State Band | `[idle] -> [loading] -> [ready]`<br>`                    \-> [error]` |
| 12 | Fan Out | `server ──> clientA`<br>`       ──> clientB`<br>`       ──> clientC` |
| 13 | Nested Scope | `Auth {`<br>`  token { gen, verify }`<br>`}` |
| 14 | Guard Gate | `[token?]`<br>` yes -> proceed`<br>` no  -> block` |
| 15 | Timed Step | `req`<br>` -> [50ms] cache`<br>` -> [200ms] db` |
| 16 | Ownership Flow | `[Auth] -> token -> [Guard] -> route` |
| 17 | Retry Arc | `try -> fail`<br>`  └-> retry(x3) -> abort` |
| 18 | Collapse | `Form(name, email, role, bio, ...)` |
| 19 | Annotation Pin | `save() // must be atomic`<br>`send() // after commit only` |
| 20 | Before After | `[dirty] ───────► [clean]`<br>`[local] ───────► [synced]` |
| 21 | Mind Root | `idea`<br>`├─ aspect1`<br>`├─ aspect2`<br>`└─ aspect3` |
| 22 | Concept Cluster | `speed :: latency, throughput, cache`<br>`safety :: auth, validate, sanitize` |
| 23 | Tension Map | `simple <────────> powerful`<br>`fast    <────────> accurate` |
| 24 | Why Chain | `slow ui`<br>` <- heavy bundle`<br>`   <- no split`<br>`      <- no config` |
| 25 | Idea Expand | `auth ...`<br>` token, session, oauth, 2fa` |
| 26 | Focus Zoom | `App > Module > Component > Line` |
| 27 | Weight Map | `perf     ███████░░░`<br>`security █████░░░░░`<br>`ux       ████████░░` |
| 28 | Comparison Row | `redis   + fast  - volatile`<br>`postgres + solid - slow` |
| 29 | Option Pick | `[ ] REST`<br>`[x] GraphQL`<br>`[ ] gRPC` |
| 30 | Assumption Flag | `user is logged in  ~assume`<br>`token is fresh      ~assume` |
| 31 | Open Question | `? how handle offline`<br>`? max payload size` |
| 32 | Decision Log | `use JWT`<br>` >> simple, stateless`<br>` xx session overhead` |
| 33 | Story Beat | `user lands`<br>` -> confused`<br>` -> reads hint`<br>` -> ah, clicks` |
| 34 | Persona Note | `[newbie]  needs guidance`<br>`[expert]   needs shortcuts` |
| 35 | Emotion Arc | `start: curious >> mid: stuck >> end: relief` |
| 36 | Friction Point | `signup -> !! too many fields -> drop` |
| 37 | Happy Path | `* open -> pick -> pay -> done` |
| 38 | Edge Case | `~ empty cart, ~ expired token, ~ offline` |
| 39 | Risk Flag | `! no rollback`<br>`! single point failure` |
| 40 | Constraint Box | `max: 100ms`<br>`min: auth required`<br>`never: store raw pw` |
| 41 | Data Shape | `user {`<br>` id, name`<br>` roles[]`<br>` meta{}`<br>`}` |
| 42 | Relation Link | `user ──< orders ──< items` |
| 43 | Cardinality | `team 1──* member`<br>`member *──* project` |
| 44 | Inheritance | `Animal`<br>` └─ Dog`<br>`    └─ Labrador` |
| 45 | Mixin Compose | `Button = Base + Hover + Disabled` |
| 46 | Type Narrow | `input: any`<br>` -> string?`<br>`   -> email?`<br>`      -> valid` |
| 47 | Null Path | `user -> address -> city ?? "unknown"` |
| 48 | Index Note | `users [ id*, email~, role ]` |
| 49 | Schema Diff | `v1 { name }`<br>`v2 { name, +avatar, -bio }` |
| 50 | Enum Scope | `status :: draft, review, live, archived` |
| 51 | Timeline | `w1: setup`<br>`w2: core`<br>`w3: polish`<br>`w4: ship` |
| 52 | Milestone | `── alpha ──> beta ──> rc ──> 1.0` |
| 53 | Blocked By | `feature A`<br>` !blocked: auth module`<br>` !blocked: api contract` |
| 54 | Done Flag | `[x] design`<br>`[x] api`<br>`[ ] tests`<br>`[ ] deploy` |
| 55 | Scope Creep | `v1: login`<br>`v1+: login, profile`<br>`v1++: login, profile, social ..!!` |
| 56 | Handoff Note | `>> design done, needs dev`<br>`>> api ready, needs QA` |
| 57 | Context Drop | `--- user already authenticated ---`<br>`proceed to fetch` |
| 58 | Section Break | `=== auth ===`<br>`... flow ...`<br>`=== data ===` |
| 59 | Callout | `>>> cache invalidation not handled yet` |
| 60 | Sidenote | `save() // (1)`<br>`(1) must run after validate` |