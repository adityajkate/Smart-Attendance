<!--
  SmartAttendance - README
  Tip: Replace placeholders like YOUR_USERNAME/YOUR_REPO and Supabase env keys.
-->

<div align="center">

<!-- Animated header (capsule-render) -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=220&text=SmartAttendance&fontAlign=50&fontAlignY=40&color=0:7C3AED,100:06B6D4&fontColor=ffffff&desc=An%20intelligent%20attendance%20tracker%20built%20with%20Expo%20%2B%20Supabase&descAlign=50&descAlignY=62" />

<!-- Typing effect -->
<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&duration=2500&pause=600&center=true&vCenter=true&width=760&lines=Track+attendance+effortlessly.;Visualize+your+progress+with+stats+and+charts.;Plan+classes%2C+avoid+shortage%2C+bunk+smartly.;Expo+%E2%9C%95+TypeScript+%E2%9C%95+Supabase" alt="Typing SVG" />
</a>

<p>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-16a34a?style=for-the-badge" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Expo%20%2F%20React%20Native-111827?style=for-the-badge&logo=expo&logoColor=white" />
  <img alt="Language" src="https://img.shields.io/badge/TypeScript-2563eb?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Backend" src="https://img.shields.io/badge/Supabase-10b981?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<p><b>SmartAttendance</b> helps students manage subjects, log attendance, and understand how many classes they can miss (or must attend) using clean dashboards and smart calculations.</p>

<p>
  <a href="#-features">Features</a> •
  <a href="#-screens--modules">Screens</a> •
  <a href="#-tech-stack">Tech</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-scripts">Scripts</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## ✨ Features

- **Subject management**: add/edit subjects and attendance targets.
- **Manual attendance**: quickly mark present/absent.
- **Insights**:
  - Bunkometer (how many you can miss / need to attend)
  - Trend & distribution charts
- **Calendar view** for planning and reviewing.
- **Cloud sync** powered by **Supabase**.

> Tip: Replace the feature list with your exact behavior if you change flows.

---

## 📱 Screens & Modules

| Screen | Route | What it does |
|---|---|---|
| Home | `app/(tabs)/index.tsx` | Overview + quick insights |
| Subjects | `app/(tabs)/subjects.tsx` | Manage subjects |
| Manual | `app/(tabs)/manual.tsx` | Mark attendance |
| Calendar | `app/(tabs)/calendar.tsx` | Attendance calendar |
| Login | `app/login.tsx` | Auth entry |

Components you’ll likely extend:
- `components/ui/AttendanceChart.tsx`
- `components/ui/Bunkometer.tsx`

---

## 🧩 Tech Stack

- **Expo (React Native)**
- **TypeScript**
- **Supabase** (Auth + DB)
- **EAS** for builds (`eas.json`)

---

## 🚀 Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Supabase

This repo includes `lib/supabase.ts`. Add your Supabase URL & anon key via Expo environment variables.

Create a `.env` (or use EAS secrets) with:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> Do not commit real keys.

### 3) Run the app

```bash
npm run start
```

Then open on:
- Android Emulator / iOS Simulator
- Expo Go on device

---

## 🗂️ Project Structure

```text
SmartAttendance/
  app/
    (tabs)/
      index.tsx
      subjects.tsx
      manual.tsx
      calendar.tsx
    login.tsx
  components/
    ui/
      AttendanceChart.tsx
      Bunkometer.tsx
  hooks/
    useAttendanceStats.ts
    useSubjects.ts
  lib/
    supabase.ts
  assets/
```

---

## 🧪 Scripts

Common commands from `package.json`:

```bash
npm run start
npm run android
npm run ios
npm run web
```

---

## 📸 Showcase (add your screenshots)

<div align="center">

<!-- Replace these with real screenshots / GIFs. Suggested paths: assets/images/... -->

<img src="https://user-images.githubusercontent.com/0000000/000000000-demo.png" width="24%" alt="Screenshot 1" />
<img src="https://user-images.githubusercontent.com/0000000/000000000-demo.png" width="24%" alt="Screenshot 2" />
<img src="https://user-images.githubusercontent.com/0000000/000000000-demo.png" width="24%" alt="Screenshot 3" />
<img src="https://user-images.githubusercontent.com/0000000/000000000-demo.png" width="24%" alt="Screenshot 4" />

</div>

---

## 🛣️ Roadmap

- [ ] Better subject analytics & comparisons
- [ ] Offline-first cache + conflict resolution
- [ ] Shareable reports (PDF / image export)
- [ ] Widgets / quick actions

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-change`
3. Commit changes: `git commit -m "feat: ..."`
4. Push: `git push origin feat/my-change`
5. Open a PR

---

## 📄 License

Licensed under the **MIT License** — see [`LICENSE`](LICENSE).

---

<div align="center">

<!-- Footer wave -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:06B6D4,100:7C3AED" />

</div>
