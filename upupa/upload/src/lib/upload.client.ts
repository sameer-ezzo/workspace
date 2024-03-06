import { Injectable, Inject } from '@angular/core';
import { STORAGE_BASE } from './di.token';
import { UploadService } from './upload.service';
import { Observable, throwError } from 'rxjs';
import { first, catchError } from 'rxjs/operators';


// STORAGEـBASE
@Injectable()
export class UploadClient {

  // private _baseOrigin: string;
  // public get baseOrigin(): string {
  //   return this._baseOrigin;
  // }

  public get baseUrl(): string {
    return this._baseUrl;
  }


  constructor(@Inject(STORAGE_BASE) private readonly _baseUrl: string,
    private uploadService: UploadService) {

    // if (!this._baseUrl.toLowerCase().includes('/storage')) {
    //   this._baseUrl = this.combine(this._baseUrl, 'storage');
    // }
    
    // this._baseOrigin = new URL(this.baseUrl).origin + '/';

  }
  upload(path: string, file: File, filename: string, formData?: any) {
    return this.uploadService.upload(this.combine(this.baseUrl, path), file, filename, formData);
  }
  uploadContent(path: string, files:{ content: string, fieldname?: string, filename: string }[], formData?: any) {
    return this.uploadService.uploadContent(this.baseUrl + path, files, formData);
  }
  delete(path: string, baseUrl?: string) {
    path =this.combine(baseUrl || this.baseUrl, path);
    return this.uploadService.delete(path);
  }

  overwrite(path: string, file: File, filename: string, formData?: any) {
    return this.uploadService.upload(this.combine(this.baseUrl, path) + '?overwrite=true', file, filename, formData);
  }

  overwriteContent(path: string, content: string, filename: string, formData?: any) {
    return this.uploadService.uploadContent(this.combine(this.baseUrl, path) + '?overwrite=true', [{ content, filename, fieldname: undefined }], formData);
  }

  get(path: string): Observable<any[]> {
    return this.uploadService.http.get<any[]>(`/api/storage?destination=storage${path}`).pipe(
      first(),
      catchError(err => throwError(err))
    );
  }


  private combine(...segments: string[]) {

    let httpPart = '';
    if (segments[0].indexOf('//') > -1) {
      httpPart = new URL(segments[0]).protocol + '//';
      segments[0] = segments[0].substring(httpPart.length, segments[0].length);

    }
    return httpPart + segments.join('/').split('/').filter(x => x.length > 0).join('/');
  }
}
