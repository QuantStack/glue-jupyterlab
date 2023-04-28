import { HTMLSelect, UseSignal } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';

import { IAdvancedLinkCategories } from '../types';

export class AdvancedLinkingChoices extends React.Component<
  AdvancedLinking.IProps,
  { dataset: string[] }
> {
  constructor(props: AdvancedLinking.IProps) {
    super(props);
    props.categories
      .then(categories => {
        this._categories = categories;
        this._advancedLinkLoaded.emit();
      })
      .catch(() => {
        this._categories = {};
        console.log('ERROR ON CATEGORIES');
      });
  }

  get value(): string {
    return this._value;
  }

  get onChange(): ISignal<this, string> {
    return this._onChange;
  }

  render(): JSX.Element {
    return (
      <UseSignal signal={this._advancedLinkLoaded} initialSender={this}>
        {(): JSX.Element => (
          <HTMLSelect
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this._value = event.target.value;
              this._onChange.emit(event.target.value);
            }}
          >
            <option value="" disabled selected hidden>
              Select an advanced link
            </option>
            {Object.keys(this._categories).map(group => (
              <optgroup label={group}>
                {this._categories[group].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </HTMLSelect>
        )}
      </UseSignal>
    );
  }

  private _value = '';
  private _categories: IAdvancedLinkCategories = {};
  private _onChange = new Signal<this, string>(this);
  private _advancedLinkLoaded = new Signal<this, void>(this);
}

namespace AdvancedLinking {
  export interface IProps {
    categories: Promise<IAdvancedLinkCategories>;
  }
}
