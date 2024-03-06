import { Subscription, BehaviorSubject, Subject, Observable } from "rxjs";

export class FileInfo {
    _id: string;

    fieldname?: string;
    originalname?: string;
    filename: string;
    size: number;

    encoding: string;
    mimetype: string;

    destination: string;
    path: string;

    date: Date;
    status?: number;
    user?: string;
    meta?: any;
}


export class ExtendedFile extends FileInfo {
    progress$: Observable<number>;
    ext: string;
    error: string;
    cancel: () => boolean = () => false;
}


export class UploadStream {
    connection: Subscription;
    progress$ = new BehaviorSubject<number>(0);
    response$ = new Subject<FileInfo>();

    cancel(): boolean {
        if (this.connection) {
            this.connection.unsubscribe();
            return true;
        }
        return false;
    }
}
