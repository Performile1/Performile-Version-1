import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';

const router: Router = Router();
const teamController = new TeamController();

// Apply authentication and rate limiting to all team routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Courier team management routes
router.get('/couriers/:courierId/members', teamController.getCourierTeamMembers.bind(teamController));
router.post('/couriers/:courierId/invite', teamController.inviteToCourierTeam.bind(teamController));

// Store team management routes
router.get('/stores/:storeId/members', teamController.getStoreTeamMembers.bind(teamController));
router.post('/stores/:storeId/invite', teamController.inviteToStoreTeam.bind(teamController));

// General team management routes
router.post('/invitations/:token/accept', teamController.acceptInvitation.bind(teamController));
router.put('/members/:teamMemberId/role', teamController.updateTeamMemberRole.bind(teamController));
router.delete('/members/:teamMemberId', teamController.removeTeamMember.bind(teamController));

// User's accessible entities
router.get('/my-entities', teamController.getUserEntities.bind(teamController));

export default router;
