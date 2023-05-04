import { HTMLSelect, UseSignal } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';

import { IAdvLinkCategories } from '../types';

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

  get onChange(): ISignal<this, AdvancedLinking.ISelected> {
    return this._onChange;
  }

  render(): JSX.Element {
    return (
      <UseSignal signal={this._advancedLinkLoaded} initialSender={this}>
        {(): JSX.Element => (
          <HTMLSelect
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this._value = event.target.value;
              const optgroup: HTMLOptGroupElement | null | undefined =
                event.target
                  .querySelector(`option[value='${this._value}']`)
                  ?.closest('optgroup');
              const selected = {
                category: optgroup?.label || '',
                linkName: this._value
              };
              this._onChange.emit(selected);
            }}
          >
            <option value="" disabled selected hidden>
              Select an advanced link
            </option>
            {Object.keys(this._categories).map(group => (
              <optgroup label={group}>
                {this._categories[group].map(link => (
                  <option key={link.display} value={link.display}>
                    {link.display}
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
  private _categories: IAdvLinkCategories = {};
  private _onChange = new Signal<this, AdvancedLinking.ISelected>(this);
  private _advancedLinkLoaded = new Signal<this, void>(this);
}

export namespace AdvancedLinking {
  export interface IProps {
    categories: Promise<IAdvLinkCategories>;
  }
  export interface ISelected {
    category: string;
    linkName: string;
  }
}
