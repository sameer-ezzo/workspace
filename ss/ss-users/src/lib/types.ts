export class SuperAdmin {
    username = "admin";
    name = "Super Admin";
    email: string;
    password: string;
}

export class UsersOptions {
    superAdmin = new SuperAdmin();
}
