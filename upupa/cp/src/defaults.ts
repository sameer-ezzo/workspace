import { DatePipe } from "@angular/common"
import { ActionDescriptor, ActionEvent } from "@upupa/common"
import { ColumnsDescriptor } from "@upupa/table"




export const defaultFormActions: ActionDescriptor[] = [
    { action: 'cancel', type: 'button', text: 'Cancel', variant: 'stroked', meta: { closeDialog: true } },
    { variant: 'raised', type: 'submit', action: 'submit', text: 'Submit', color: 'primary', meta: { closeDialog: true } }
]


export const defaultListColumns: ColumnsDescriptor = {
    select: 0,
    name: { header: 'Name' },
    date: { pipe: { pipe: DatePipe, args: ['short'] } }
}

export function defaultCreateListItemHandler(scaffolder, value, subject) {
    return {
        action: 'create', icon: 'add', position: 'header', variant: 'icon', handler: async (event: ActionEvent) => {

            const result = await scaffolder.dialogForm("/create/event/do", null, value)
            if (result) subject.next({ ...value, do: [...value.do, result] })
        }
    } as ActionDescriptor
}

export const defaultListHeaderActions: ActionDescriptor[] = [
    { position: 'header', action: 'create', variant:'stroked', icon: 'add_circle_outline', text: 'Create' }
]
export const defaultListActions: ActionDescriptor[] = [
    { variant: 'icon', action: 'edit', icon: 'edit', menu: false },
    { position: 'menu', action: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
]