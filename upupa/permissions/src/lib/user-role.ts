export type UserRole = { _id: string, name: string }

export const appDefaultAdminRoles = [
    { _id: "super-admin", name: "Super Admin" },
    { _id: "admin", name: "Admin" },
    { _id: "developer", name: "Developer" },
]