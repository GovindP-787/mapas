# Project Dependencies and Libraries

This document lists all the packages, libraries, and dependencies we have installed so far across the **Mapas Backend** (Python) and the **Mapas Dashboard** (Next.js/React).

---

## Backend (`mapas-backend`)
These are the installed Python dependencies running our FastAPI server, database connections, face verification, and audio streaming features.

| Package | Version | Description / Purpose |
|---------|---------|-----------------------|
| `fastapi` | `^0.109.0` | Main web framework for the backend API |
| `uvicorn` | `^0.27.0` | ASGI server for running FastAPI |
| `insightface` | `^0.7.3` | Face recognition and analysis models |
| `onnxruntime` | `^1.17.1` | Required runtime for InsightFace models |
| `opencv-python`| `^4.9.0.80` | Image/Video processing and webcam integration |
| `numpy` | `^1.24.3` | Mathematical operations and array handling |
| `python-multipart`| `^0.0.6` | Form-data parsing for file uploads |
| `python-dotenv`| `^1.0.0` | Environment variable (dotenv) management |
| `pydantic` | `^2.5.0` | Data validation and typing |
| `pydantic-settings`| `^2.1.0` | Settings management using Pydantic |
| `Pillow` | `^10.1.0` | Image processing library |
| `scipy` | `^1.11.4` | Scientific/mathematical functions |
| `pymongo` | `^4.6.1` | MongoDB database driver for Python |
| `pyttsx3` | `^2.90` | Offline Text-to-Speech (TTS) engine |
| `python-dateutil`| `^2.8.2` | Advanced datetime parsing |
| `PyAudio` | `^0.2.13` | Microphone/Audio streaming access |
| `websockets` | `^12.0` | WebSocket connections (audio streaming) |
| `requests` | `^2.31.0` | HTTP client for external integrations |
| `elevenlabs` | `>=1.0.0` | Cloud-based advanced TTS service |

---

## Frontend Widget & UI (`mapas-dashboard`)
These are the Next.js and React dependencies driving the administrative dashboard, UI components, and 3D graphics rendering.

### Dependencies (Production)
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `16.1.6` | React framework handling SSR, routing, and APIs |
| `react` & `react-dom` | `19.2.3` | Core UI libraries |
| `next-auth` | `^5.0.0-beta.30` | Authentication (Auth.js) |
| `three` | `^0.183.2` | Core 3D engine |
| `@react-three/fiber` | `^9.5.0` | React renderer for Three.js |
| `@react-three/drei` | `^10.7.7` | Utility components for Three.js |
| `gsap` | `^3.14.2` | Deep animation system |
| `@gsap/react` | `^2.1.2` | GSAP hooks for React |
| `lenis` | `^1.3.18-dev.0` | Smooth scrolling physics |
| `recharts` | `^2.15.4` | Data visualization charts |
| `lucide-react` | `^0.563.0` | SVG Icon suite |
| `next-themes` | `^0.4.6` | Dark/Light mode theme toggling |
| `sonner` | `^2.0.7` | Toast notifications |
| `radix-ui` & `@radix-ui/*` | `Various` | Headless, accessible UI foundation |
| `tailwind-merge` | `^3.4.0` | Utility for merging Tailwind CSS classes |
| `clsx` | `^2.1.1` | Utility for constructing `className` strings |
| `class-variance-authority` | `^0.7.1` | Component style variants |

### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `^4` | Core CSS utility framework |
| `@tailwindcss/postcss` | `^4` | Tailwind PostCSS integration |
| `eslint` & `eslint-config-next`| `^9` & `16.1.6` | Code linting and style checking |
| `typescript` | `^5` | Strict static typing for JS |
| `@types/*` | `Various` | TS declarations (Node, React, Three, etc.) |
| `shadcn` | `^3.8.4` | Component generator CLI |
| `tw-animate-css` | `^1.4.0` | Tailwind animation utilities |
