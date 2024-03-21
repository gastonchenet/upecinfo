type NotificationActionType = "TODATE" | "TOPAGE";
type NotificationAction = `${NotificationActionType}:${string}`;

type Notification = {
	title: string;
	body: string;
	icon:
		| "add-circle-outline"
		| "remove-circle-outline"
		| "create-outline"
		| null;
	action: NotificationAction | null;
	createdAt: string;
};

export type { NotificationAction, Notification };
