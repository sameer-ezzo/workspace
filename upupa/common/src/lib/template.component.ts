import { Component, Input, OnInit, OnDestroy, ViewContainerRef, inject, ComponentRef, SimpleChanges, } from '@angular/core'
import { CommonModule } from '@angular/common'

function getMethods(obj: Object) {
    const prototype = Object.getPrototypeOf(obj)
    const methods = Object.getOwnPropertyNames(prototype).filter((key) => typeof prototype[key] === 'function')
    const fields = Object.keys(obj).filter((key) => typeof (obj as any)[key] === 'function')
    return [...methods, ...fields]
}

@Component({ template: `` })
export class TemplateBase<T = any> {
    @Input() model?: T
}

@Component({
    selector: 'upupa-template',
    
    imports: [],
    template: ``,
})
export class TemplateComponent<T = any> implements OnDestroy {

    host = inject(ViewContainerRef)

    @Input() template = ''
    @Input() styles?: string | string[]
    @Input() model?: T
    @Input() handler: any

    componentRef?: ComponentRef<TemplateBase>


    ngOnChanges(changes: SimpleChanges) {
        if (changes['template']) this.loadComponent({ template: this.template, styles: this.styles }, this.model)
        if (changes['styles']) this.loadComponent({ template: this.template, styles: this.styles }, this.model)
        if (changes['model'] && this.componentRef) this.componentRef.setInput('model', this.model)
        if (changes['handler'] && this.componentRef) this.setHandler(this.handler)
    }

    ngOnDestroy() {
        this.componentRef?.destroy()
    }

    private loadComponent(options: Component, model?: T, handler?: any) {
        if (this.componentRef) {
            this.componentRef.destroy()
            this.componentRef = undefined
            this.host.clear()
        }

        const componentType = Component({
            ...options,
            
            imports: [CommonModule],
        })(TemplateBase)

        this.componentRef = this.host.createComponent(componentType)
        this.setHandler(handler)

        this.componentRef.setInput('model', model)
    }

    private _methods: string[] = []
    private setHandler(handler: any) {
        if (!this.componentRef?.instance) return

        const instance = this.componentRef.instance as any
        for (const method of this._methods) {
            delete instance[method]
        }

        if (!handler) return

        this._methods = getMethods(handler)
        for (const method of this._methods) {
            instance[method] = handler[method].bind(handler)
        }
    }
}

// EXAMPLE USAGE

// @Component({
//     selector: 'app-root',
//     
//     imports: [TemplateComponent],
//     template: `<upupa-template [template]="template" [model]="model" [handler]="this" ></upupa-template>`,
// })
// export class App {

//     model: any = { name: 'John', date: new Date() }
//     template = `
//   <div>
//   Hello, {{model.name}}!
//   @if(model.name) {
//     <button (click)="myFunc()">Date: {{model.date|date:'yyyy'}}</button>
//   }
//   </div>`


//     myFunc() { console.log('myFunc') }
// }