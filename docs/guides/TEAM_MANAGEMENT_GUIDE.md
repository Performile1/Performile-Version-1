# Team Management Implementation Guide

## Overview
This document outlines the comprehensive multi-user team support implementation for the Performile logistics platform, enabling courier companies and merchant stores to manage multiple team members with role-based access control.

## Features Implemented

### 1. Database Schema
- **CourierTeamMembers**: Links users to courier companies with roles and permissions
- **StoreTeamMembers**: Links users to stores with roles and permissions  
- **TeamInvitations**: Manages invitation workflow with secure tokens
- **Enums**: `team_role` and `invitation_status` for type safety
- **Functions**: Permission checking and entity access functions
- **Triggers**: Automatic owner assignment on entity creation

### 2. Backend API (`/api/team`)

#### Courier Team Management
- `GET /couriers/:courierId/members` - Get team members
- `POST /couriers/:courierId/invite` - Invite new member

#### Store Team Management  
- `GET /stores/:storeId/members` - Get team members
- `POST /stores/:storeId/invite` - Invite new member

#### General Team Operations
- `POST /invitations/:token/accept` - Accept invitation
- `PUT /members/:teamMemberId/role` - Update member role
- `DELETE /members/:teamMemberId` - Remove member
- `GET /my-entities` - Get user's accessible entities

### 3. Role Hierarchy
1. **Owner** - Full control, cannot be removed
2. **Admin** - Full management except ownership transfer
3. **Manager** - Can invite members and edit content
4. **Member** - Standard access to features
5. **Viewer** - Read-only access

### 4. Frontend Components

#### Core Components
- `TeamMembersList` - Display and manage team members
- `InviteMemberDialog` - Invite new team members
- `AcceptInvitation` - Handle invitation acceptance
- `TeamManagement` - Main team management page

#### React Hooks
- `useTeamApi` - Complete API integration with React Query
- Automatic cache invalidation and error handling
- Type-safe mutations and queries

### 5. Security Features
- **Permission Checks**: Database-level and API-level validation
- **Role Hierarchy**: Prevents privilege escalation
- **Secure Tokens**: JWT-based invitation tokens with expiration
- **Input Validation**: Comprehensive validation with Joi schemas
- **Rate Limiting**: Applied to all team endpoints

## Usage Guide

### For Team Owners/Admins

#### Inviting Team Members
1. Navigate to Team Management page (`/team`)
2. Select the courier company or store
3. Click "Invite Member"
4. Enter email address and select role
5. Member receives invitation email with secure link

#### Managing Existing Members
1. View team members in the Team Management page
2. Use the actions menu to:
   - Edit member roles (if you have permission)
   - Remove members (if you have permission)
3. Role changes are applied immediately

#### Role Permissions
- **Owner/Admin**: Can invite, remove, and change roles
- **Manager**: Can invite members only
- **Member/Viewer**: Cannot manage team

### For Invited Users

#### Accepting Invitations
1. Click the invitation link received via email
2. Review invitation details (entity, role, permissions)
3. Click "Accept Invitation" to join the team
4. Automatically redirected to team management

#### Accessing Team Resources
1. Navigate to Team Management to see your teams
2. Switch between different courier companies and stores
3. Access level determined by your role in each team

## Technical Implementation

### Database Migration
Run the migration to add team management tables:
```sql
-- File: database/migrations/add_team_management.sql
-- Contains all necessary tables, functions, and triggers
```

### Backend Integration
The team routes are automatically integrated into the Express server:
```typescript
// Added to server.ts
this.app.use('/api/team', teamRoutes);
```

### Frontend Routing
Team management routes added to App.tsx:
```typescript
<Route path="/team" element={<TeamManagement />} />
<Route path="/invite/:token" element={<AcceptInvitation />} />
```

### Navigation Menu
Team management option added to the navigation menu for eligible users (admin, merchant, courier roles).

## API Examples

### Invite Member to Courier Team
```bash
POST /api/team/couriers/123/invite
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "newmember@example.com",
  "teamRole": "member"
}
```

### Get Team Members
```bash
GET /api/team/couriers/123/members
Authorization: Bearer <token>
```

### Accept Invitation
```bash
POST /api/team/invitations/abc123token/accept
Authorization: Bearer <token>
```

## Error Handling
- Comprehensive error messages for all scenarios
- Frontend toast notifications for user feedback
- Automatic retry mechanisms for failed requests
- Graceful handling of expired invitations

## Security Considerations
- All endpoints require authentication
- Permission checks at multiple levels
- Secure token generation for invitations
- Rate limiting to prevent abuse
- Input sanitization and validation

## Future Enhancements
- Email notification system for invitations
- Bulk member management
- Advanced permission customization
- Team activity audit logs
- Integration with external identity providers

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check user role and entity ownership
2. **Invitation Expired**: Request new invitation from team admin
3. **Email Not Received**: Check spam folder, verify email address
4. **Role Update Failed**: Ensure you have admin/owner permissions

### Database Issues
- Ensure migration has been run successfully
- Check foreign key constraints
- Verify trigger functions are created

### Frontend Issues
- Clear browser cache if components don't load
- Check network tab for API errors
- Verify authentication tokens are valid

## Support
For technical support or questions about team management features, refer to the main project documentation or contact the development team.
