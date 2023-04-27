import { HTMLSelect, UseSignal } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';

export class DatasetSwitcherComponent extends React.Component<DatasetSwitcherComponent.IProps> {
  constructor(props: DatasetSwitcherComponent.IProps) {
    super(props);
    this._datasetList = props.datasetList || [];
    this._name = props.name;
    if (this._datasetList.length) {
      this._value = this._datasetList[0];
    }
  }

  get name(): string {
    return this._name;
  }

  get value(): string {
    return this._value;
  }
  set value(value: string) {
    this._value = value;
    this._onChange.emit(this._value);
  }

  get onChange(): ISignal<this, string> {
    return this._onChange;
  }

  get datasetList(): string[] {
    return this._datasetList;
  }
  set datasetList(values: string[]) {
    this._datasetList = values;
    if (this._datasetList.length) {
      this._value = this._datasetList[0];
    }
    this._onChange.emit(this._value);
  }

  render(): JSX.Element {
    return (
      <UseSignal signal={this._onChange} initialSender={this}>
        {(): JSX.Element => (
          <HTMLSelect
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              this._value = event.target.value;
              this._onChange.emit(event.target.value);
            }}
          >
            {this._datasetList.map(dataset => (
              <option
                key={dataset}
                value={dataset}
                selected={this._value === dataset}
              >
                {dataset}
              </option>
            ))}
          </HTMLSelect>
        )}
      </UseSignal>
    );
  }

  private _name: string;
  private _value = '';
  private _datasetList: string[];
  private _onChange = new Signal<this, string>(this);
}

namespace DatasetSwitcherComponent {
  export interface IProps {
    name: string;
    datasetList?: string[];
  }
}
