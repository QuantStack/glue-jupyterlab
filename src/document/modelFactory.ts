import { IGlueSessionSharedModel } from './../types';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';

import { GlueSessionModel } from './docModel';

export class GlueSessionModelFactory
  implements DocumentRegistry.IModelFactory<GlueSessionModel>
{
  collaborative = true;
  /**
   * The name of the model.
   *
   * @returns The name
   */
  get name(): string {
    return 'gluelab-session-model';
  }

  /**
   * The content type of the file.
   *
   * @returns The content type
   */
  get contentType(): Contents.ContentType {
    return 'glu';
  }

  /**
   * The format of the file.
   *
   * @returns the file format
   */
  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  /**
   * Get whether the model factory has been disposed.
   *
   * @returns disposed status
   */

  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose the model factory.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * Get the preferred language given the path on the file.
   *
   * @param path path of the file represented by this document model
   * @returns The preferred language
   */
  preferredLanguage(path: string): string {
    return '';
  }

  /**
   * Create a new instance of GlueSessionModel.
   *
   * @param languagePreference Language
   * @param modelDB Model database
   * @returns The model
   */
  createNew(options: {
    sharedModel: IGlueSessionSharedModel;
  }): GlueSessionModel {
    const model = new GlueSessionModel(options);
    return model;
  }

  private _disposed = false;
}

export namespace GlueSessionModelFactory {
  export interface IOptions {
    o?: any;
  }
}
