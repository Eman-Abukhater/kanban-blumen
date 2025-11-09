# Database Setup Scripts

This guide explains how to set up your initial data (projects and members).

## Problem

When you authenticate through `/authuser` endpoint, it checks if you're a member of the project. If the `project_members` table is empty, you'll get "Access denied to this project" error.

## Solution

Use the provided scripts to create projects and add members to them.

---

## 1. Adding Projects

Use the `add-project.ts` script to create new projects.

### Usage

#### Step 1: View available users

```bash
npm run add-project
```

This will display all users with their IDs.

#### Step 2: Create a project

```bash
npm run add-project "<title>" "<description>" <createdById> [autoAddCreator]
```

**Parameters:**

- `title`: The name of the project (required, use quotes)
- `description`: Project description (required, use quotes, can be empty "")
- `createdById`: The ID of the user creating the project (required)
- `autoAddCreator`: Automatically add creator as admin (optional, defaults to true)

### Examples

**Create a project with description:**

```bash
npm run add-project "My Kanban Project" "Project for team collaboration" 1
```

**Create a project without description:**

```bash
npm run add-project "Quick Project" "" 1
```

**Create without auto-adding creator:**

```bash
npm run add-project "Test Project" "Testing" 1 false
```

### What the script does

1. ✅ Lists all available users
2. ✅ Lists existing projects
3. ✅ Validates that the creator user exists
4. ✅ Creates the project
5. ✅ Automatically adds creator as admin member (by default)
6. ✅ Shows project details and members

---

## 2. Adding Project Members

Use the `add-project-member.ts` script to add users to existing projects.

### Usage

#### Step 1: View available users and projects

```bash
npm run add-member
```

This will display all users and projects with their IDs.

#### Step 2: Add a user to a project

```bash
npm run add-member <userId> <projectId> [role]
```

**Parameters:**

- `userId`: The ID of the user to add (required)
- `projectId`: The ID of the project (required)
- `role`: Either "admin" or "member" (optional, defaults to "admin")

### Examples

**Add user #1 as admin to project #1:**

```bash
npm run add-member 1 1 admin
```

**Add user #2 as member to project #3:**

```bash
npm run add-member 2 3 member
```

**Add yourself (assuming your user ID is 1 and project ID is 1):**

```bash
npm run add-member 1 1 admin
```

### What the script does

1. ✅ Lists all available users and projects
2. ✅ Validates that the user and project exist
3. ✅ Checks if the user is already a member
4. ✅ Updates the role if user is already a member
5. ✅ Creates a new project member entry if user is not a member
6. ✅ Shows all current members of the project

---

## Alternative: Using Prisma Studio

You can also manually manage data using Prisma Studio:

### For Projects:

1. Open Prisma Studio:

   ```bash
   npm run db:studio
   ```

2. Navigate to the `projects` table

3. Click "Add record" and fill in:

   - `title`: Your project name
   - `description`: Optional description
   - `createdById`: User ID who creates it

4. Then navigate to `project_members` and add the creator as admin

### For Members:

1. Open Prisma Studio (same command as above)

2. Navigate to the `project_members` table

3. Click "Add record"

4. Fill in:

   - `projectId`: Your project ID
   - `userId`: Your user ID
   - `role`: "admin" or "member"

5. Click "Save"

---

## Quick Start Guide

**First time setup:**

1. **Check your users:**

   ```bash
   npm run add-member
   ```

   Note down your user ID (usually 1 if you're the first user)

2. **Create your first project:**

   ```bash
   npm run add-project "My First Project" "Getting started with Kanban" 1
   ```

   This will create a project AND automatically add you as admin!

3. **Try authenticating:**
   Now you can authenticate with your user ID and the new project ID in your frontend.

**Adding more members:**

```bash
npm run add-member 2 1 member
```

---

## Roles

- **admin**: Full access to the project, can add/remove members
- **member**: Regular member access to boards and cards

## Troubleshooting

**Error: "User with ID X not found"**

- Check available users by running `npm run add-member` without arguments
- Ensure you've imported/created users in your database

**Error: "Project with ID X not found"**

- Run `npm run add-project` without arguments to see existing projects
- Create a project first using the add-project script

**Still getting "Access denied"?**

- Verify the user is active (`isActive = true` in users table)
- Check that the projectId in your auth request matches the project you added the member to
- Ensure the creator was automatically added as admin (or manually add them)
- Clear any caches and try again
