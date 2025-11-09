# Complete Setup Guide

This guide will help you set up your Kanban application from scratch.

## 🚀 Quick Start

Follow these steps in order to get your application running:

### Step 1: Create Your First Project

After importing users to your Supabase database, create your first project:

```bash
cd kanban-backend-
npm run add-project "My First Kanban Project" "Team collaboration project" 1
```

**Parameters explained:**

- `"My First Kanban Project"` - Your project name
- `"Team collaboration project"` - Description (optional, can use "")
- `1` - User ID (change this to your actual user ID)

**Output:**

```
✅ Project created successfully! Project ID: 1
✅ Creator added as admin successfully!

📊 Project Details:
   ID: 1
   Title: My First Kanban Project
   ...
```

**Important:** Note the Project ID (e.g., `1`) - you'll need this!

### Step 2: Verify Project Member

The script automatically adds the creator as an admin member. To verify:

```bash
npm run add-member
```

You should see your project and the member in the lists.

### Step 3: Start Your Backend

```bash
npm run dev
```

The backend should start on `http://localhost:7260`

### Step 4: Update Frontend API URL (if needed)

Check `kanban-main/src/services/kanbanApi.tsx`:

```typescript
const Base_URL: string = "http://localhost:7260/api";
```

Make sure this matches your backend URL.

### Step 5: Start Your Frontend

```bash
cd ../kanban-main
npm run dev
```

The frontend should start on `http://localhost:3000`

### Step 6: Access Your Application

1. Open `http://localhost:3000`
2. The app will redirect to `/auth/1/1` (you can customize this in `index.tsx`)
3. After authentication, you'll see your **Projects List**
4. Click on your project to see its **Boards**
5. Click on a board to see the **Kanban Board**

---

## 📁 Application Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Home (/)                                         │
│    └─> Checks if authenticated                      │
│        ├─> Yes: Redirect to /projects               │
│        └─> No: Redirect to /auth/1/1                │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ 2. Auth (/auth/[projectId]/[userId])                │
│    └─> Logs in and authenticates user               │
│        └─> Redirect to /projects                     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ 3. Projects List (/projects)                        │
│    ├─> Shows all projects user has access to        │
│    ├─> Create new projects                          │
│    └─> Click project to view boards                 │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ 4. Board List (/boardList/[projectId])              │
│    ├─> Shows all boards in the project              │
│    ├─> Create new boards                            │
│    └─> Click board to view kanban                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ 5. Kanban Board (/kanbanList/[boardId])             │
│    ├─> View kanban lists and cards                  │
│    ├─> Drag and drop cards                          │
│    ├─> Add tasks, tags, etc.                        │
│    └─> Full kanban functionality                    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Advanced Setup

### Adding More Members to a Project

```bash
npm run add-member <userId> <projectId> <role>
```

**Example:**

```bash
npm run add-member 2 1 member
```

### Creating Multiple Projects

```bash
npm run add-project "Frontend Team" "Frontend development tasks" 1
npm run add-project "Backend Team" "Backend development tasks" 1
npm run add-project "Marketing" "Marketing campaigns" 1
```

### Checking Your Data

Use Prisma Studio to view and manage your data:

```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can:

- View all tables
- Add/edit/delete records
- Check relationships

---

## 🎯 Features

### Projects Page Features:

- ✅ View all projects you're a member of
- ✅ See project details (creator, boards count, members count)
- ✅ Create new projects
- ✅ Click to view project boards
- ✅ Beautiful animations and loading states
- ✅ Responsive design

### Board List Features:

- ✅ View all boards in a project
- ✅ Create and edit boards
- ✅ Real-time updates via SignalR
- ✅ Project context displayed in header
- ✅ Navigate to kanban board

### Kanban Board Features:

- ✅ Full kanban functionality
- ✅ Drag and drop
- ✅ Tasks, tags, assignments
- ✅ Real-time collaboration
- ✅ File uploads via Cloudinary

---

## 🐛 Troubleshooting

### "Project with ID X not found"

- **Solution:** Create a project first using `npm run add-project`

### "Access denied to this project"

- **Solution:** Add yourself as a member using `npm run add-member 1 1 admin`

### "User not found or inactive"

- **Solution:** Check your users table in Prisma Studio
- Make sure `isActive = true`

### Projects page shows no projects

- **Solution:**
  1. Check if you're authenticated (token exists in localStorage)
  2. Verify you're a member of at least one project
  3. Check browser console for API errors

### Backend connection errors

- **Solution:**
  1. Verify backend is running on correct port
  2. Check `kanbanApi.tsx` has correct `Base_URL`
  3. Verify database connection in backend `.env`

### Authentication issues

- **Solution:**
  1. Clear localStorage: `localStorage.clear()`
  2. Clear sessionStorage: `sessionStorage.clear()`
  3. Restart both frontend and backend
  4. Try authenticating again

---

## 📝 Configuration

### Customize Auth Default Values

Edit `kanban-main/src/pages/index.tsx`:

```typescript
r.replace("/auth/1/1"); // Change 1/1 to your projectId/userId
```

### Customize Loading Times

Edit loading configuration in `projects.tsx` or `boardList/[id].tsx`:

```typescript
const minLoadingTime = 800; // Minimum loading time in ms
const firstVisitDelay = isFirstVisit ? 3000 : 0; // First visit delay
```

---

## 🎨 Customization

### Change Animations

Edit the Lottie animation imports in `projects.tsx`:

```typescript
import animation_space from "../../public/animationRocket.json"; // Change this
import animationSettings from "../../public/animationSettings.json"; // Change this
```

### Change Theme Colors

The application uses Tailwind CSS. Modify colors in the components:

- `bg-blue-500` - Blue background
- `bg-green-500` - Green background
- `bg-gray-100` - Gray background

---

## 📚 Additional Resources

### Scripts Reference

- `npm run add-project` - Create projects
- `npm run add-member` - Add project members
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations
- `npm run dev` - Start development server

### API Endpoints

- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects/:id/members` - Add member
- `GET /api/ProjKanbanBoards/authuser` - Authenticate user
- `GET /api/ProjKanbanBoards/getBoardlist` - Get boards
- `GET /api/ProjKanbanBoards/getkanbanlist` - Get kanban data

---

## 🎉 You're All Set!

Your Kanban application should now be fully functional with:

- ✅ User authentication
- ✅ Multiple projects
- ✅ Project members management
- ✅ Board management
- ✅ Full kanban functionality
- ✅ Real-time updates

Enjoy building your projects! 🚀
