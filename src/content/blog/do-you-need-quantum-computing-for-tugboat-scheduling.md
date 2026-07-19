---
title: "Do You Need Quantum Computing for Tugboat Scheduling?"
description: "Spoiler: No. A 1980s Intel 386 and classic Linear Programming can solve port logistics scheduling. Here's why the quantum hype is overengineered nonsense — and what actually works."
pubDate: 'Jul 19, 2026'
heroImage: '../../assets/quantum-vs-tugboat-scheduling.png'
---

Yes. But only under two specific conditions: you love overengineering simple problems, or you've found a government grant committee gullible enough to hand over taxpayer money to fund your buzzword addiction.

If you don't fall into either category, you can actually solve this problem using a computer from the late 1980s—like an old Intel 386—and a classic mathematical method called **Linear Programming (LP)**.

### The 1930s Tech That Still Rules Logistics

Fun fact: I actually started a PhD thesis on Linear Programming. The method dates back to the 1930s, pioneered by the Soviet mathematician and Nobel laureate **Leonid Kantorovich**. Fast forward to today—in a world completely obsessed with AI and quantum hype—and linear optimization models are still the absolute gold standard for scheduling problems of all kinds. Why? Because they work.

To pull this off, you don't need a breakthrough in physics. You just need to:

1. **Formalize the problem:** Translate your real-world port logistics into a mathematical model with a target Objective Function and a set of real-world constraints.

2. **Deploy a Solver:** You can use heavy-duty commercial solvers like CPLEX or excellent open-source alternatives.

### Our Tech Stack (Total Budget: €2.99 / Month)

For our live demo optimizing the Port of Hamburg, we didn't contract a quantum research lab. Instead, we used:

- **GNU MathProg** for the problem definition.
- **GLPK** (GNU Linear Programming Kit) as our core solver.

If GLPK ever becomes a bottleneck as port traffic scales, the upgrade path is seamless: we can just switch to **CBC** or **HiGHS**. Both accept the same problem class and are considerably faster on larger Mixed-Integer Programming (MIP) problems. But for current port sizes? Good old `glpsol` handles it flawlessly.

Since finding a functional 386 computer is a bit tough these days, we run this model on the absolute cheapest virtual server you can rent on Hetzner. It costs roughly **€2.99 a month**.

### The Actual Model

Here's the complete model that powers our live tug scheduling. It's written in GNU MathProg (GMPL) — a modelling language that reads almost like a textbook optimization problem. The server combines this model text with live data (jobs, tugs, travel times) and solves it with GLPK.

The core idea: assign tugs to vessel assist jobs so that every job gets enough bollard pull, no tug is double-booked, travel times between berths are respected, and vessels wait as little as possible.

```
# Tug planning model (GNU MathProg / GMPL)
# ==========================================
#
# Assigns tugs to arrival/departure assist jobs. This model text is
# editable: the server combines it with live data (jobs, tugs, travel
# times) and solves it with GLPK. Data is injected as a separate GMPL
# data section - only sets/params declared here are available.
#
# Bollard pull: every job needs a minimum total bollard pull. Any tug
# combination that reaches it is allowed - two big tugs or three small
# ones - up to maxTugs per job.
#
# Travel times (jtravel/approach/ret) come from the port's travel
# matrix: steaming minutes between berths, the sea meeting point and
# the tug resting areas, mined from the port's historical tug jobs
# (25th-percentile observed leg times; unobserved pairs fall back to
# geographic distance scaled by the port's measured detour factor).
#
# Times are minutes from "now".

set J;                          # jobs (vessel assists)
set T;                          # tugs

param bp{T} >= 0;               # bollard pull of each tug [t]
param reqbp{J} >= 0;            # required total bollard pull per job [t]
param dur{J} >= 0;              # job duration [min]
param earliest{J};              # earliest job start [min from now]
param latest{J};                # latest acceptable start [min from now]
# Tug travel (a tug steams from its resting area out to the departing
# berth or the sea meeting point, assists, then steams back):
param jtravel{J, J} >= 0;       # steam from job i's END to job j's START [min]
param approach{J} >= 0;         # steam: resting area -> job's START [min]
param ret{J} >= 0;              # steam: job's END -> resting area [min]

param maxTugs >= 1;             # max tugs on one job
param maxDuty >= 0;             # max total work per tug in horizon [min]
param Wwait >= 0;               # objective weight: vessel waiting
param Wunserved >= 0;           # objective weight: unserved jobs
param Wassign >= 0;             # objective weight: tug deployments
param Wtravel >= 0;             # objective weight: total tug steaming
param M;                        # big-M (longer than the horizon)

var x{J, T} binary;             # tug t works job j
var serve{J} binary;            # job j is served at all
var start{J} >= 0;              # start time of job j [min from now]
var wait{J} >= 0;               # start delay beyond earliest [min]
var y{i in J, j in J: i < j} binary;   # 1 if job i starts before job j

# Served jobs must reach their required bollard pull.
s.t. pull{j in J}:
    sum{t in T} bp[t] * x[j, t] >= reqbp[j] * serve[j];

# No tugs on unserved jobs; at most maxTugs on any job.
s.t. crew{j in J}:
    sum{t in T} x[j, t] <= maxTugs * serve[j];

# Time window: never start early; late only if the job is dropped.
s.t. window_lo{j in J}: start[j] >= earliest[j];
s.t. window_hi{j in J}: start[j] <= latest[j] + M * (1 - serve[j]);

# A served job cannot start before a tug could steam out to it.
s.t. rest_approach{j in J}: start[j] >= approach[j] * serve[j];

s.t. waiting{j in J}: wait[j] >= start[j] - earliest[j];

# A tug can only do one job at a time and needs to steam between
# job locations.
s.t. seq_fwd{i in J, j in J, t in T: i < j}:
    start[j] >= start[i] + dur[i] + jtravel[i, j]
        - M * (3 - x[i, t] - x[j, t] - y[i, j]);
s.t. seq_bwd{i in J, j in J, t in T: i < j}:
    start[i] >= start[j] + dur[j] + jtravel[j, i]
        - M * (2 - x[i, t] - x[j, t] + y[i, j]);

# Duty rule: cap each tug's total work in the horizon.
s.t. duty{t in T}:
    sum{j in J} (dur[j] + ret[j]) * x[j, t] <= maxDuty;

minimize cost:
      Wwait * sum{j in J} wait[j]
    + Wunserved * sum{j in J} (1 - serve[j])
    + Wassign * sum{j in J, t in T} x[j, t]
    + Wtravel * sum{j in J, t in T} (approach[j] + ret[j]) * x[j, t];

solve;

# Machine-readable solution for the API.
printf 'SOLUTION_START\n';
printf{j in J, t in T: x[j, t] > 0.5}
    'ASSIGN %s %s %g\n', j, t, start[j];
printf{j in J: serve[j] < 0.5} 'UNSERVED %s\n', j;
printf 'OBJECTIVE %g\n',
      Wwait * (sum{j in J} wait[j])
    + Wunserved * (sum{j in J} (1 - serve[j]))
    + Wassign * (sum{j in J, t in T} x[j, t])
    + Wtravel * (sum{j in J, t in T}
                    (approach[j] + ret[j]) * x[j, t]);
printf 'SOLUTION_END\n';

end;
```

That's the entire optimizer. No neural networks, no qubits, no cloud GPU clusters. Just clean math that a 1930s-era algorithm can solve in seconds.

### The Takeaway

You don't need a quantum computer to optimize logistics. You just need solid, classic mathematics. That said... if you do manage to find an investor or a bureaucrat willing to write a massive check just because you said the word "Quantum," by all means, take their money.

**See it in action:** Test out our tug scheduling model running on real-time data at [PortTracker Forecast](https://porttracker.co/forecast).
