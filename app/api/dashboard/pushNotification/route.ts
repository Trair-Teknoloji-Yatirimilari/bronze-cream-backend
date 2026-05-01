import { withAuth } from "@/lib/authMiddleware";
import { NotificationController } from "./controllers/notification.controller";

// Route handlers - Temiz ve basit
export const POST = NotificationController.registerPushToken;
export const PUT = withAuth((request, adminId) => 
  NotificationController.sendNotification(request, adminId!)
);
export const GET = withAuth(NotificationController.getStats);