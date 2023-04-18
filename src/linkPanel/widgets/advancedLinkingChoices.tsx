import { HTMLSelect } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';

export class AdvancedLinking extends React.Component<
  AdvancedLinking.IProps,
  { dataset: string[] }
> {
  constructor(props: AdvancedLinking.IProps) {
    super(props);
    this._categories = props.categories || DefaultCategories;
  }

  get value(): string {
    return this._value;
  }

  get onChange(): ISignal<this, string> {
    return this._onChange;
  }

  render(): JSX.Element {
    return (
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
    );
  }

  private _value = '';
  private _categories: AdvancedLinking.ICategories;
  private _onChange = new Signal<this, string>(this);
}

namespace AdvancedLinking {
  export interface IProps {
    categories?: ICategories;
  }

  export interface ICategories {
    [group: string]: string[];
  }
}

export const DefaultCategories: AdvancedLinking.ICategories = {
  General: ['identity', 'length_to_volume'],
  Astronomy: [
    'Galactic <-> FK5 (J2000)',
    'FK4 (B1950) <-> FK5 (J2000)',
    'ICRS <-> FK5 (J2000)',
    'Galactic <-> FK4 (B1950)',
    'ICRS <-> FK4 (B1950)',
    'ICRS <-> Galactic',
    '3D Galactocentric <-> Galactic',
    'WCS link'
  ],
  Join: ['Join on ID']
};
