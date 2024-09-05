import { DatePipe } from "@angular/common"
import { ActionDescriptor, ActionEvent } from "@upupa/common"
import { ColumnsDescriptor } from "@upupa/table"




export const defaultFormActions: ActionDescriptor[] = [
    { name: 'cancel', type: 'button', text: 'Discard', variant: 'stroked' },
    { variant: 'raised', type: 'submit', name: 'submit', text: 'Submit', color: 'primary' }
]


export const defaultListColumns: ColumnsDescriptor = {
    select: 0,
    name: { header: 'Name' },
    date: { pipe: { pipe: DatePipe, args: ['short'] } }
}

export function defaultCreateListItemHandler(scaffolder, value, subject) {
    return {
        name: 'create',
        action: 'create',
        icon: 'add',
        header: true,
        variant: 'icon',
        handler: async (event: ActionEvent) => {

            const result = await scaffolder.dialogForm("/create/event/do", null, value)
            if (result) subject.next({ ...value, do: [...value.do, result] })
        }
    } as ActionDescriptor
}

export const defaultListHeaderActions: ActionDescriptor[] = [
    { name: 'create', variant: 'stroked', icon: 'add_circle_outline', text: 'Create', header: true }
]
export const defaultListActions: ActionDescriptor[] = [
    { variant: 'icon', name: 'edit', icon: 'edit', menu: false },
    { name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
]