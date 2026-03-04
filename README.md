# ProcessMiner - Process Data Mining Platform

A comprehensive process data mining application similar to Celonis, built with the MERN stack. This application visualizes process flows, identifies bottlenecks, and provides analytics for SoftwareONE order processing workflows.

![Process Mining](https://img.shields.io/badge/Process-Mining-6366f1)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-10b981)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### 📊 Dashboard
- Real-time KPI monitoring
- Case volume trends
- Activity frequency analysis
- Status distribution visualization

### 🕸️ Spaghetti Chart (Process Flow)
- Interactive process flow visualization
- Color-coded transitions (green=fast, red=slow bottlenecks)
- Line thickness represents transition frequency
- Zoom, pan, and hover for detailed insights
- Click on nodes/edges for detailed metrics

### 📁 Case Management
- Browse all process cases
- Filter by status, variant, region, priority
- View detailed event timeline for each case
- Pagination support

### 🔀 Variant Analysis
- Discover different process execution paths
- Compare variant performance
- Visualize process paths step-by-step
- Completion rate by variant

### 📈 Analytics
- Time-series analysis (daily, weekly, monthly)
- Activity performance metrics
- Cost analysis
- Resource utilization

### ⚠️ Bottleneck Detection
- Identify slowest transitions
- Activity wait time analysis
- Severity indicators (critical, high, medium, low)
- Optimization recommendations

## Tech Stack

- **Frontend**: React 18, D3.js, Recharts, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Styling**: Custom CSS with dark theme (Celonis-inspired)

## Prerequisites

- Node.js >= 16.x
- MongoDB >= 6.x
- npm or yarn

## Installation

### 1. Clone the repository
```bash
cd "/Users/mandeeplubana/Desktop/Process Data Mining/process-mining-app"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment

The backend `.env` file is already configured with defaults:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/process-mining
NODE_ENV=development
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or run directly
mongod
```

### 6. Seed the Database
```bash
cd backend
npm run seed
```

This will generate:
- ~2000 order processing cases
- Multiple process variants (Standard, Express, Enterprise, etc.)
- Realistic event logs with timestamps
- Process transitions with timing data

### 7. Start the Application

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/process/stats` | Overall process statistics |
| `GET /api/process/flow` | Process flow data for visualization |
| `GET /api/process/cases` | List cases with filtering |
| `GET /api/process/cases/:id` | Case details with events |
| `GET /api/process/variants` | Variant analysis |
| `GET /api/process/activities` | Activity metrics |
| `GET /api/process/analytics/time` | Time-based analytics |
| `GET /api/process/analytics/bottlenecks` | Bottleneck analysis |
| `GET /api/process/filters` | Filter options |

## Process Variants

The seed data includes 5 SoftwareONE order processing variants:

1. **Standard Order** (40%) - Full order processing workflow
2. **Express Order** (20%) - Streamlined for quick fulfillment
3. **License Renewal** (15%) - Renewal-specific path
4. **Enterprise Order** (15%) - Extended validation for enterprise
5. **Quick Deployment** (10%) - Minimal validation path

## Order Processing Activities

1. Order Received
2. Order Validation
3. Credit Check
4. License Verification
5. Inventory Check
6. Quote Generation
7. Customer Approval
8. Payment Processing
9. License Provisioning
10. Software Deployment
11. Configuration Setup
12. Quality Assurance
13. Customer Notification
14. Order Completed

## Screenshots

### Dashboard
Overview of key process metrics and trends.

### Spaghetti Chart
Interactive visualization showing all process paths with color-coded performance indicators.

### Variant Analysis
Compare different execution paths and their performance metrics.

### Bottleneck Analysis
Identify and prioritize process improvement opportunities.

## Project Structure

```
process-mining-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── processController.js
│   ├── models/
│   │   ├── Case.js
│   │   ├── ProcessEvent.js
│   │   └── ProcessTransition.js
│   ├── routes/
│   │   └── processRoutes.js
│   ├── seeds/
│   │   └── seedData.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── ProcessFlow.js
│   │   │   ├── Cases.js
│   │   │   ├── Variants.js
│   │   │   ├── Analytics.js
│   │   │   └── Bottlenecks.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── helpers.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by Celonis Process Mining
- SoftwareONE order processing workflow
- D3.js for powerful visualizations
- Recharts for React-based charts
