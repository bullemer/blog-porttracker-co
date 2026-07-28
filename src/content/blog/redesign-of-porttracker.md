---
title: "Redesign of PortTracker"
description: "Me and Claude worked hard on the remake of PortTracker — we kept a lot of the good old tools but also built a lot of new stuff. 3D live views, the Svitzer-era tugboat analytics, ETA/ETD with terminal data, berth and tug planning, and an Android APK that turns any old phone into a serious AIS station."
pubDate: 'Jul 28, 2026'
heroImage: '../../assets/porttracker-redesign-hero.png'
---

Me and Claude worked hard on the remake of [PortTracker](https://www.porttracker.co/landing) over the last weeks. We kept a lot of the good old tools — but we also developed a lot of new stuff. Here are the highlights.

## 3D Views

Get stunning [3D live views](https://www.porttracker.co/live3d) with live AIS traffic from your port. Real terrain, real buildings, real vessels moving through it — and an autopilot mode that tours the traffic by itself while the logbook streams the events next to it. Honestly, I keep it open on a second screen just because it looks good.

## Tugboat Analytics

Our old [tugboat analytics](https://www.porttracker.co/eco-tug) — the ones we developed a long time ago for Svitzer — are back. Still probably the most reliable analytics out there for job matching, mob, demob, fuel, overspeeding and all the rest. Plus market shares per operator, and the CO2 and fuel saving potential in actual numbers, at the fuel price you type in.

## ETA / ETD

The [forecast](https://www.porttracker.co/forecast) got a serious upgrade: some ports now have authority and terminal data included, next to our own AIS-based predictions. You can see in the source column exactly where each arrival time comes from — and when a terminal has confirmed it.

## Berth and Tugboat Planning

You can now connect the AIS data with some clever LR models and do fast, easy scheduling for tugs and berths. As I wrote [a while ago](/blog/do-you-need-quantum-computing-for-tugboat-scheduling/) — no quantum computer needed. The traffic history your port already generates is enough.

## And the best part: our new Android APK

Use your old phone or tablet and set up a reliable, precise [AIS station](https://www.porttracker.co/cover-your-port) that outperforms all the Pis and other devices — and is also cheaper and uses less power. I have been [preaching this for a while](/blog/using-old-phones-as-ais-receivers/), and now it is a product: install the app, sign in, plug in the SDR stick, done. The station registers itself, updates itself, and shows you its own reception statistics — messages per hour, vessels heard, and how far it reaches in every direction.

---

So: if you are hosting an AIS station for your company or business, you should [have a look at PortTracker](https://www.porttracker.co/cover-your-port) — the next generation of AIS platform. And if your port is not on it yet, you know exactly what to do with that old phone in your drawer.
