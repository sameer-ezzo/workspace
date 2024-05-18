import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  OnChanges,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  signal,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DataService, ServerDataSource, DataAdapter } from "@upupa/data";
import { AuthService, User } from "@upupa/auth";
import {
  ActionDescriptor,
  ActionEvent,
  ConfirmService,
  DialogService,
  EventBus,
  toTitleCase,
} from "@upupa/common";
import { ColumnsDescriptor } from "@upupa/table";
import { UserFormComponent } from "../user-form/user-form.component";
import { SnackBarService } from "@upupa/common";
import { USERS_MANAGEMENT_OPTIONS } from "../di.token";
import {
  defaultUserListActions,
  defaultUserListColumns,
  UsersManagementOptions,
} from "../types";
import { firstValueFrom } from "rxjs";
import { AdminUserPasswordRestComponent } from "../admin-userpwd-reset/admin-userpwd-reset.component";
import { EditUserRolesComponent } from "../edit-user-roles/edit-user-roles.component";
import { Field, Fieldset, FormScheme } from "@upupa/dynamic-form";

type ModelType = { _id: string; email: string } & Partial<User>;

@Component({
  selector: "users-list",
  templateUrl: "./users-list.component.html",
  styleUrls: ["./users-list.component.scss"],
})
export class UsersListComponent implements OnChanges, AfterViewInit {
  focusedUser: any;

  private _options: UsersManagementOptions;
  usersDataSource: ServerDataSource<ModelType>;


  @Input()
  public get options(): UsersManagementOptions {
    return this._options;
  }
  public set options(value: UsersManagementOptions) {
    this._options = value;
    this._setOptions(value);
  }
  @Input() templates: any;
  @Output() action = new EventEmitter<ActionEvent>();
  actions: ActionDescriptor[] = defaultUserListActions;
  columns: ColumnsDescriptor = defaultUserListColumns;

  _templates: any = {};
  @ViewChild("emailTemplate") emailTemplate: any;
  @ViewChild("phoneTemplate") phoneTemplate: any;

  @Input() adapter: DataAdapter<ModelType>;
  loading = false;

  private readonly _usersManagementOptions: UsersManagementOptions;
  constructor(
    public data: DataService,
    public http: HttpClient,
    private bus: EventBus,
    public auth: AuthService,
    public snack: SnackBarService,
    public confirm: ConfirmService,
    public dialog: DialogService
  ) {
    this._usersManagementOptions = inject(USERS_MANAGEMENT_OPTIONS);
  }

  readonly dataAdapter = signal(null);
  userSelect = []
  private _setOptions(options: UsersManagementOptions) {
    const usersOptions = options.lists?.users ?? {
      columns: this.columns,
      actions: this.actions,
    };
    this.columns = usersOptions.columns;
    this.actions = usersOptions.actions as any[];

    this.userSelect = [
      ...new Set([
        "_id",
        "email",
        ...Object.getOwnPropertyNames(this.columns ?? {}),
      ]),
    ];

    this.usersDataSource = new ServerDataSource<ModelType>(this.data, "/v2/user", this.userSelect);
    if (this.adapter) {
      this.adapter.destroy();
      this.adapter = null;
    }
    if(this.adapter) this.adapter.destroy();
    
    this.adapter = new DataAdapter(this.usersDataSource, "_id", "email", "_id", null, {
      page: { pageIndex: 0, pageSize: 100 },
      sort: { active: "date", direction: "desc" },
      terms: [{ field: "email", type: "like" }],
    });
    this.dataAdapter.set(this.adapter);
    this.adapter.refresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.options ??= this._usersManagementOptions;
    if (changes["templates"])
      this._templates = Object.assign(this._templates ?? {}, this.templates);
  }



  ngAfterViewInit(): void {
    if (!this.options) this.options = this._usersManagementOptions;
    if (this._templates.email === undefined)
      this._templates.email = this.emailTemplate;
    if (this._templates.phone === undefined)
      this._templates.phone = this.phoneTemplate;
  }

  async onAction(e: ActionEvent) {
    if (e.action === null) return;

    this.loading = true;
    let task: Promise<any>;
    const users = e.data;
    const user = users?.[0];

    switch (e.action.action) {
      case "impersonate":
        this.bus.emit("impersonating-user", true, this);
        try {
          await this.auth.impersonate(user._id);
          this.bus.emit("user-impersonated", true, this);
        } catch (error) {
          this.bus.emit("impersonating-user-failed", true, this);
        }
        setTimeout(() => {
          document.location.reload();
        }, 250);
        break;
      case "create":
      case "edit": {

        const mode = e.action.action === 'create' ? 'createUser' : 'editUser';
        const formOptions = this.options.forms[mode]
        let fullUser = user
        if (mode === 'editUser') {
          // fill missing user data for the targeted form
          const formKeys = extractKeysFromFormScheme(formOptions.scheme ?? {})
          const missingKeys = formKeys.filter(k => !this.userSelect.includes(k))
          if (missingKeys.length > 0) {
            const missingData = await firstValueFrom(this.data.get<any>(`/v2/user/${user._id}`, {
              select: missingKeys.join(',')
            })).then(x => x.data?.[0 ?? user])
            fullUser = { ...user, ...missingData }
          }
        }
        task = firstValueFrom(
          this.dialog
            .openDialog(UserFormComponent, {
              title: toTitleCase(`${e.action.action} user`),
              inputs: {
                user: fullUser,
                mode,
                options: formOptions, // this should be FormOptions only
              }
            })
            .afterClosed()
        );
        break;
      }
      case "change-user-roles": {
        task = firstValueFrom(this.dialog.openDialog(EditUserRolesComponent, {
          title: "Change User Roles",
          inputs: { user: users[0] }
        }).afterClosed())
        break;
      }
      case "reset":
        task = firstValueFrom(
          this.dialog
            .openDialog(AdminUserPasswordRestComponent, {
              title: "Reset Password",
              inputs: { user: users[0] }
            })
            .afterClosed()
        );
        break;
      case "ban":
        if (
          await this.confirm.openWarning({
            title: "Ban user",
            confirmText:
              "Banning a user will halt all their current activities. Are you sure you want to proceed with this action?",
            yes: "Yes, Proceed",
            no: "Discard",
          })
        ) {
          await this.banUser(user._id, !user.disabled);
          this.snack.openSuccess("User banned");
          await this.data.refreshCache(`/v2/user`);
          await this.adapter.refresh();
        }
        break;
      case "delete": {
        if (user.roles?.indexOf("super-admin") > -1) return;
        const d = {
          title: "Delete user",
          confirmText: "Do you really want to delete this user permanently?",
          yes: "Delete it",
          no: "Keep it",
        };
        if (await this.confirm.openWarning(d)) {
          await this.data.delete(`/user/${user._id}`);
          this.snack.openSuccess("User deleted");
          await this.data.refreshCache(`/v2/user`);
          await this.adapter.refresh();
        }
        break;
      }
      default:
        this.action.emit(e);
        this.bus.emit(e.action.action, e, this);
        break;
    }

    try {
      if (task) {
        if (await task) {
          this.snack.openSuccess();
          await this.data.refreshCache(`/v2/user`);
          await this.adapter.refresh();
        }
      }
    } catch (error) {
      this.snack.openFailed();
    } finally {
      this.loading = false;
    }
  }

  async banUser(id: string, lock = true) {
    const baseUrl = this.auth.baseUrl;
    await firstValueFrom(this.http.post(`${baseUrl}/lock`, { id, lock }));
    return true;
  }
}
function extractKeysFromFormScheme(scheme: FormScheme): string[] {
  const keys = Object.getOwnPropertyNames(scheme ?? {})
  for (const key of keys) {
    const item = scheme[key] as Field
    if (item.type === 'fieldset') {
      keys.push(...extractKeysFromFormScheme((item as Fieldset).items).map(k => `${key}.${k}`))
    }
  }
  return keys
}

