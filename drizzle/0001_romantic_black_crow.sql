CREATE TABLE `inspections` (
	`id` varchar(64) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`status` varchar(32) NOT NULL,
	`complianceScore` int NOT NULL,
	`inspectorNotes` text,
	`extractedData` json NOT NULL,
	`evaluation` json NOT NULL,
	`evidence` json NOT NULL,
	`regionFlags` json NOT NULL,
	`reportKey` varchar(512),
	`reportUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
